import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { count } from "drizzle-orm";
import { cellCommunities } from "../database/drizzle/schema";
import { getDatabase } from "./helpers/db";
import { verifyOrigin } from "./helpers/auth";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (!verifyOrigin(event)) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: "Forbidden" }),
        };
    }
    
    const db = await getDatabase();

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
      body: "Internal Server Error",
    };
  }
};
