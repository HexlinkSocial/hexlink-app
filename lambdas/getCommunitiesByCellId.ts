import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import { Request } from "express";
import * as schema from "../backend/drizzle/schema";

// Supabase pooler uses a self-signed cert chain not trusted by Node's
// default CA bundle. Disable verification for database connections only.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  max: 1,
});

const db = drizzle(pool, { schema });

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function getQueryParam(
  event: APIGatewayProxyEventV2 | Request,
  key: string,
): string | undefined {
  if ("queryStringParameters" in event) {
    return event.queryStringParameters?.[key];
  } else if ("query" in event) {
    const val = event.query[key];
    return typeof val === "string" ? val : undefined;
  }
  return undefined;
}

export const handler = async (
  event: APIGatewayProxyEventV2 | Request,
): Promise<APIGatewayProxyStructuredResultV2> => {
  const cellId = getQueryParam(event, "cellId");

  if (cellId === undefined) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Missing required query parameter: cellId",
      }),
    };
  }

  try {
    const cellCommunitiesResults = await db.query.cellCommunities.findMany({
      where: eq(schema.cellCommunities.cellId, cellId),
      with: {
        community: {
          columns: {
            id: true,
            name: true,
            description: true,
            communityLink: true,
          },
        },
      },
    });

    const communities = cellCommunitiesResults
      .map((cc) => cc.community)
      .filter(Boolean);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(communities),
    };
  } catch (e) {
    console.error("CommunitiesByCellId error:", e);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: (e as Error).message }),
    };
  }
};
