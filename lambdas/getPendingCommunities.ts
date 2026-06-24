import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { asc } from "drizzle-orm";
import * as schema from "../database/drizzle/schema";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  max: 1,
});

const db = drizzle(pool, { schema });

function isAdmin(event: APIGatewayProxyEventV2): boolean {
  if ("requestContext" in event && "authorizer" in event.requestContext) {
    const authorizer = event.requestContext.authorizer as {
      jwt?: { claims?: Record<string, unknown> };
    };
    const groups = authorizer?.jwt?.claims?.["cognito:groups"];
    if (Array.isArray(groups)) return groups.includes("Admins");
    if (typeof groups === "string") return groups.split(",").includes("Admins");
  }
  return false;
}

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (!isAdmin(event)) {
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
