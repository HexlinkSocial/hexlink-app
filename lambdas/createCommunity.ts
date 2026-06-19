import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Request } from "express";
import * as schema from "../database/drizzle/schema";

// Supabase pooler uses a self-signed cert chain not trusted by Node's
// default CA bundle. Disable verification for database connections only.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  max: 1,
});

const db = drizzle(pool, { schema });

// TODO factor our when needed again
function getRequestBody(event: APIGatewayProxyEventV2 | Request): any {
  if ("body" in event && event.body != null) {
    if (typeof event.body === "string") {
      try {
        return JSON.parse(event.body as string);
      } catch {
        return {};
      }
    }
    return event.body;
  }
  return {};
}

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  event: APIGatewayProxyEventV2 | Request,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const bodyData = getRequestBody(event);
    const { name, description, owner, communityLink, cellIds } = bodyData;

    if (
      name == null ||
      owner == null ||
      !Array.isArray(cellIds) ||
      cellIds.length === 0
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Missing fields. 'name', 'owner', and a non-empty array of 'cellIds' are required.",
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
      body: JSON.stringify({
        message: "Community created successfully along with tile associations",
        community: transactionResult,
      }),
    };
  } catch (e) {
    console.error("Database Write Transaction Error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
