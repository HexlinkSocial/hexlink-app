import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { asc } from "drizzle-orm";
import * as schema from "../database/drizzle/schema";
import { isAdmin } from "./helpers/auth";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  max: 1,
});

const db = drizzle(pool, { schema });

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (!(await isAdmin(event))) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Forbidden: Admin group access required",
        }),
      };
    }

    const pendingRequests = await db
      .select()
      .from(schema.approvals)
      .orderBy(asc(schema.approvals.createdAt));

    return {
      statusCode: 200,
      body: JSON.stringify(pendingRequests),
    };
  } catch (e: unknown) {
    console.error("Fetch execution error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal Server Error",
      }),
    };
  }
};
