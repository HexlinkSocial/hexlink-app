import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { eq } from "drizzle-orm";
import * as schema from "../database/drizzle/schema";
import { getUser, verifyOrigin } from "./helpers/auth";
import { getDatabase } from "./helpers/db";

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (!verifyOrigin(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

  try {
    const userId = await getUser(event);
    if (userId == null) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: "Unauthorized: Missing cognito sub identity context",
        }),
      };
    }

    const db = await getDatabase();

    const userApprovals = await db
      .select()
      .from(schema.approvals)
      .where(eq(schema.approvals.owner, userId));

    const userCommunities = await db
      .select()
      .from(schema.communities)
      .where(eq(schema.communities.owner, userId));

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
