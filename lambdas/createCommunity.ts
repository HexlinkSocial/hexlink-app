import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../database/drizzle/schema";
import { getRequestBody } from "./helpers/request";

// Supabase pooler uses a self-signed cert chain not trusted by Node's
// default CA bundle. Disable verification for database connections only.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  max: 1,
});

const db = drizzle(pool, { schema });

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const bodyData = getRequestBody(event);
    const { name, description, owner, ownerEmail, communityLink, cellIds } =
      bodyData;

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

    const [newApproval] = await db
      .insert(schema.approvals)
      .values({
        name,
        description: description !== undefined ? description : null,
        owner,
        ownerEmail,
        communityLink: communityLink !== undefined ? communityLink : null,
        cellIds: cellIds,
        status: "pending",
      })
      .returning();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Community submission routed to approvals workflow",
        approval: newApproval,
      }),
    };
  } catch (e) {
    console.error("Database Write Error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
