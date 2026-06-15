import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

const handler = async (): Promise<APIGatewayProxyStructuredResultV2> => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "badoop" }),
  };
};

module.exports = { handler };