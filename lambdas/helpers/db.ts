import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import * as schema from "../../database/drizzle/schema";

export type DbInstance = ReturnType<typeof drizzle<typeof schema>>;
export type TransactionContext = Parameters<
  Parameters<DbInstance["transaction"]>[0]
>[0];

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
let cachedDb: DbInstance | null = null;
let cachedPool: Pool | null = null;
let cachedCaCert: string | null = null;

const ssm = new SSMClient({});

async function getCaCert(): Promise<string | undefined> {
  if (cachedCaCert != null) {
    return cachedCaCert;
  }

  const paramName = process.env.DB_CA_CERT_PARAM ?? "db-ca-cert-1";

  try {
    const res = await ssm.send(
      new GetParameterCommand({ Name: paramName, WithDecryption: true }),
    );
    cachedCaCert = res.Parameter?.Value ?? null;
  } catch (e) {
    console.error(`Failed to fetch SSM parameter "${paramName}":`, e);
    cachedCaCert = null;
  }

  return cachedCaCert ?? undefined;
}

export async function getDatabase(): Promise<DbInstance> {
  if (cachedDb != null) {
    return cachedDb;
  }

  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.delete("sslmode");

  const ca = await getCaCert();

  cachedPool = new Pool({
    connectionString: url.toString(),
    ssl:
      process.env.NODE_ENV === "production"
        ? ca != null
          ? { ca, rejectUnauthorized: true }
          : { rejectUnauthorized: false }
        : false,
    max: 1,
  });

  cachedDb = drizzle(cachedPool, { schema });
  return cachedDb;
}
