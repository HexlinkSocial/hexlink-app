import { CognitoJwtVerifier } from "aws-jwt-verify";
import { APIGatewayProxyEventV2 } from "aws-lambda";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.COGNITO_CLIENT_ID!,
});

function extractToken(
  event: APIGatewayProxyEventV2,
): string | null | undefined {
  const authHeader =
    event.headers?.Authorization ?? event.headers?.authorization;
  if (!(authHeader?.startsWith("Bearer ") ?? false)) return null;
  return authHeader?.slice(7);
}

export async function isAdmin(event: APIGatewayProxyEventV2): Promise<boolean> {
  const token = extractToken(event);
  if (token == null) return false;

  try {
    const payload = await verifier.verify(token);
    const groups = payload["cognito:groups"];
    return Array.isArray(groups) && groups.includes("Admins");
  } catch (error) {
    console.error("Admin verification failed:", error);
    return false;
  }
}

export async function getUser(
  event: APIGatewayProxyEventV2,
): Promise<string | null> {
  const token = extractToken(event);
  if (token == null) return null;

  try {
    const payload = await verifier.verify(token);

    const userId = payload.sub;
    return typeof userId === "string" ? userId : null;
  } catch (error) {
    console.error("User verification failed:", error);
    return null;
  }
}
