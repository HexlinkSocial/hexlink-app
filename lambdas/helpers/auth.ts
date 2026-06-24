import { APIGatewayProxyEventV2 } from "aws-lambda";

export function isAdmin(event: APIGatewayProxyEventV2): boolean {
  if (process.env.NODE_ENV !== "production") {
    const mockGroupsHeader = event.headers?.["X-Mock-Groups"];

    if (mockGroupsHeader != null) {
      return mockGroupsHeader.split(",").includes("Admins");
    }
  }

  const authorizer = event.requestContext?.authorizer;
  const groups = authorizer?.jwt?.claims?.["cognito:groups"];

  if (Array.isArray(groups)) {
    return groups.includes("Admins");
  }

  if (typeof groups === "string") {
    return groups.split(" ").includes("Admins");
  }

  return false;
}
