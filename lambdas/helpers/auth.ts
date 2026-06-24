import { CognitoJwtVerifier } from "aws-jwt-verify";
import { APIGatewayProxyEventV2 } from "aws-lambda";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export async function isAdmin(event: APIGatewayProxyEventV2): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") {
    const mockGroupsHeader = event.headers?.["x-mock-groups"];
    if (mockGroupsHeader != null) {
      return mockGroupsHeader.split(",").includes("Admins");
    }
  }

  const authHeader = event.headers?.authorization;
  if (!(authHeader?.startsWith("Bearer ") ?? false)) return false;

  try {
    const payload = await verifier.verify(authHeader?.slice(7));
    const groups = payload["cognito:groups"];
    return Array.isArray(groups) && groups.includes("Admins");
  } catch {
    return false;
  }
}
