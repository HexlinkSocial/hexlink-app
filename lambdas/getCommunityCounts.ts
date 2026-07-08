import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { count } from "drizzle-orm";
import { cellCommunities } from "../database/drizzle/schema";
import { getDatabase } from "./helpers/db";

export const handler = async (): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
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
