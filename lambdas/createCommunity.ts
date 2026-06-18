import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Request } from "express";
import * as schema from "../database/drizzle/schema";

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
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

export const handler = async (
  event: APIGatewayProxyEventV2 | Request,
): Promise<APIGatewayProxyStructuredResultV2> => {
  if ("requestContext" in event && event.requestContext.http.method === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  try {
    let bodyData: any = {};
    if ("body" in event && event.body) {
      bodyData = JSON.parse(event.body);
    } else if ("body" in event === false) {
      bodyData = (event as any).body;
    }

    const { name, description, owner, communityLink, cellIds } = bodyData;

    if (!name || !owner || !Array.isArray(cellIds) || cellIds.length === 0) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "Missing fields. 'name', 'owner', and a non-empty array of 'cellIds' are required.",
        }),
      };
    }

    const transactionResult = await db.transaction(async (tx) => {
      const [newCommunity] = await tx
        .insert(schema.communities)
        .values({
          name,
          description,
          owner,
          communityLink,
        })
        .returning();

      const joinRecords = cellIds.map((cellId: string) => ({
        cellId,
        communityId: newCommunity.id,
      }));

      await tx.insert(schema.cellCommunities).values(joinRecords);

      return newCommunity;
    });

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: "Community created successfully along with tile associations",
        community: transactionResult,
      }),
    };
  } catch (e) {
    console.error("Database Write Transaction Error:", e);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};