import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";

export interface FrontendErrorPayload {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing log payload body." }),
      };
    }

    const payload = JSON.parse(event.body) as FrontendErrorPayload;

    if (!payload.message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Property 'message' is required." }),
      };
    }

    console.error(
      JSON.stringify({
        level: "ERROR",
        source: "frontend",
        message: payload.message,
        userAgent: payload.userAgent ?? "N/A",
        timestamp: new Date().toISOString(),
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "success" }),
    };
  } catch (e) {
    console.error("Failed to process frontend log:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};