import { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

type JwtEvent = APIGatewayProxyEventV2WithJWTAuthorizer;

type AuthorizableEvent =
  JwtEvent | { requestContext: Partial<JwtEvent["requestContext"]> };

function getClaims(
  event: AuthorizableEvent,
): Record<string, string | number | boolean | string[] | null> | undefined {
  const authorizer = (event.requestContext as JwtEvent["requestContext"])
    ?.authorizer;
  return authorizer?.jwt?.claims;
}

export function isAdmin(event: AuthorizableEvent): boolean {
  const claims = getClaims(event);
  if (claims == null) return false;

  const groups = claims["cognito:groups"];
  if (Array.isArray(groups)) return groups.includes("Admins");
  if (typeof groups === "string") {
    return groups
      .split(/[,\s]+/)
      .filter(Boolean)
      .includes("Admins");
  }
  return false;
}

export function getUser(event: AuthorizableEvent): string | null {
  const claims = getClaims(event);
  const userId = claims?.sub;
  return typeof userId === "string" ? userId : null;
}

export function getOwnerEmail(event: AuthorizableEvent): string | null {
  const claims = getClaims(event);
  const email = claims?.email;
  return typeof email === "string" ? email : null;
}
