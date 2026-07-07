import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../database/drizzle/schema";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: process.env.AWS_REGION ?? "eu-west-2" });

export type DbInstance = ReturnType<typeof drizzle<typeof schema>>;
export type TransactionContext = Parameters<
  Parameters<DbInstance["transaction"]>[0]
>[0];

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
let cachedDb: DbInstance | null = null;
let cachedPool: Pool | null = null;

export async function getDatabase(): Promise<DbInstance> {
  if (cachedDb != null) {
    return cachedDb;
  }

  let caCert: string | undefined = undefined;

  if (process.env.NODE_ENV === "production") {
    try {
      const [cert1] = await Promise.all([
        ssm.send(
          new GetParameterCommand({
            Name: "db-ca-cert-1",
            WithDecryption: true,
          }),
        ),
      ]);

      const val1 = cert1.Parameter?.Value?.trim() ?? "";

      caCert = `${val1}`;
    } catch (error) {
      console.error(
        "Failed to fetch split DB CA Certificates from SSM Parameter Store:",
        error,
      );
      throw error;
    }
  }

  cachedPool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: true,
            ca: caCert,
          }
        : false,
    max: 1,
  });

  cachedDb = drizzle(cachedPool, { schema });
  return cachedDb;
}
