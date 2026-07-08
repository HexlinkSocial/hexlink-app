import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import * as schema from "../../database/drizzle/schema";

export type DbInstance = ReturnType<typeof drizzle<typeof schema>>;
export type TransactionContext = Parameters<
  Parameters<DbInstance["transaction"]>[0]
>[0];

type SslConfig = false | { ca: string; rejectUnauthorized: true };

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
let cachedDb: DbInstance | null = null;
let cachedPool: Pool | null = null;
let cachedCaCert: string | null = null;
let initPromise: Promise<DbInstance> | null = null;

const ssm = new SSMClient({});

async function getCaCert(): Promise<string | undefined> {
  if (cachedCaCert != null) {
    return cachedCaCert;
  }
  const paramName = process.env.DB_CA_CERT_PARAM ?? "db-ca-cert-1";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await ssm.send(
      new GetParameterCommand({ Name: paramName, WithDecryption: true }),
      { abortSignal: controller.signal },
    );
    const value = res.Parameter?.Value;
    if (value != null) {
      cachedCaCert = value;
    }
    return value ?? undefined;
  } catch (e) {
    console.error(`Failed to fetch SSM parameter "${paramName}":`, e);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

function getSslConfig(ca: string | undefined): SslConfig {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    return false;
  }
  if (ca == null) {
    throw new Error(
      "Production database connection aborted: Missing required CA certificate for secure SSL validation.",
    );
  }
  return {
    ca,
    rejectUnauthorized: true,
  };
}

function resetCache(): void {
  cachedDb = null;
  cachedPool = null;
}

async function createDb(): Promise<DbInstance> {
  const rawUrl = process.env.DATABASE_URL;
  if (rawUrl == null) {
    throw new Error(
      "DATABASE_URL is not set. Ensure it's configured (Supabase pooler connection string, e.g. port 6543 in transaction mode).",
    );
  }

  const url = new URL(rawUrl);
  url.searchParams.delete("sslmode");

  const ca = await getCaCert();
  const ssl = getSslConfig(ca);

  const poolConfig: PoolConfig = {
    connectionString: url.toString(),
    ssl,
    max: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10_000,
    // Guards against a single hung query pinning the container's only
    // connection for the lifetime of the execution environment.
    statement_timeout: 10_000,
    query_timeout: 10_000,
  };

  const pool = new Pool(poolConfig);

  pool.on("error", (err) => {
    console.error("Unexpected error on idle Lambda database client:", err);
    resetCache();
  });

  cachedPool = pool;
  cachedDb = drizzle(pool, { schema });
  return cachedDb;
}

async function isPoolAlive(pool: Pool): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export async function getDatabase(): Promise<DbInstance> {
  if (cachedDb != null && cachedPool != null) {
    if (await isPoolAlive(cachedPool)) {
      return cachedDb;
    }
    console.warn("Cached DB connection is stale; reconnecting.");
    await cachedPool.end().catch(() => undefined);
    resetCache();
  }

  if (initPromise != null) {
    return initPromise;
  }

  initPromise = createDb();
  try {
    return await initPromise;
  } catch (e) {
    resetCache();
    throw e;
  } finally {
    initPromise = null;
  }
}
