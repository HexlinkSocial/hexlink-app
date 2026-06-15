import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { count } from "drizzle-orm";
import { Pool } from "pg";
import { cellCommunities } from "../backend/drizzle/schema";

// Supabase pooler uses a self-signed cert chain not trusted by Node's
// default CA bundle. Disable verification for database connections only
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  max: 1,
});

const db = drizzle(pool);

export const handler = async (): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const communitiesGrouped = await db
      .select({
        cellId: cellCommunities.cellId,
        count: count(cellCommunities.cellId),
      })
      .from(cellCommunities)
      .groupBy(cellCommunities.cellId);

    const result = communitiesGrouped.map((c) => ({
      cellId: c.cellId,
      communityCount: Number(c.count),
    }));
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (e as Error).message }),
    };
  }
};
