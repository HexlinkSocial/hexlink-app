import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../database/drizzle/schema";

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
    const userId =
      event.requestContext?.Authorizer?.jwt?.claims?.sub ??
      event.requestContext?.Authorizer?.claims?.sub ??
      event.requestContext?.authorizer?.jwt?.claims?.sub ??
      event.requestContext?.authorizer?.claims?.sub;

    if (userId == null) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: "Unauthorized: Missing cognito sub identity context",
        }),
      };
    }

    const userApprovals = await db
      .select()
      .from(schema.approvals)
      .where(eq(schema.approvals.owner, userId as string));

    const userCommunities = await db
      .select()
      .from(schema.communities)
      .where(eq(schema.communities.owner, userId as string));

    return {
      statusCode: 200,
      body: JSON.stringify({
        approvals: userApprovals,
        communities: userCommunities,
      }),
    };
  } catch (e: unknown) {
    console.error("Fetch execution error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
