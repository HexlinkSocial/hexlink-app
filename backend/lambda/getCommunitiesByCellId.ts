import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Request } from "express";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  max: 1,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
    const cellCommunities = await prisma.cellCommunity.findMany({
      where: { cellId },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            description: true,
            community_link: true,
          },
        },
      },
    });

    const communities = cellCommunities.map((cc) => cc.community);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(communities),
    };
  } catch (e) {
    console.error("getCommunitiesByCellId error:", e);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: (e as Error).message }),
    };
  }
};
