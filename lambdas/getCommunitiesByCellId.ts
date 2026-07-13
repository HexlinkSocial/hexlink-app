import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { eq } from "drizzle-orm";
import * as schema from "../database/drizzle/schema";
import { getDatabase } from "./helpers/db";

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function getQueryParam(
  event: APIGatewayProxyEventV2,
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
  event: APIGatewayProxyEventV2,
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
    const db = await getDatabase();

    const cellCommunitiesResults = await db.query.cellCommunities.findMany({
      where: eq(schema.cellCommunities.cellId, cellId),
      with: {
        community: {
          columns: {
            id: true,
            name: true,
            description: true,
            whatsapp: true,
            discord: true,
            facebook: true,
            other: true,
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
      body: "Internal Server Error",
    };
  }
};
