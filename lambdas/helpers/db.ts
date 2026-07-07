import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../database/drizzle/schema";

export type DbInstance = ReturnType<typeof drizzle<typeof schema>>;
export type TransactionContext = Parameters<
  Parameters<DbInstance["transaction"]>[0]
>[0];

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
let cachedDb: DbInstance | null = null;
let cachedPool: Pool | null = null;

export function getDatabase(): DbInstance {
  if (cachedDb != null) {
    return cachedDb;
  }

  cachedPool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false,
          }
        : false,
    max: 1,
  });

  cachedDb = drizzle(cachedPool, { schema });
  return cachedDb;
}
