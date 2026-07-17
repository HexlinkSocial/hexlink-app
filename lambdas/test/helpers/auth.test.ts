import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { isAdmin, getUser, getOwnerEmail, verifyOrigin } from "../../helpers/auth";

type JwtEvent = Parameters<typeof isAdmin>[0];

const createFakeEventWithClaims = (claims: Record<string, any>): JwtEvent => {
  return {
    requestContext: {
      authorizer: {
        jwt: {
          claims,
        },
      },
    },
  } as unknown as JwtEvent;
};

describe("auth helpers", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  describe("isAdmin", () => {
    it("returns false if there are no claims or authorizer in the request context", () => {
      const event = {} as JwtEvent;
      expect(isAdmin(event)).toBe(false);
    });

    it("returns false if cognito:groups claim is entirely missing", () => {
      const event = createFakeEventWithClaims({ sub: "user-123" });
      expect(isAdmin(event)).toBe(false);
    });

    it("returns true when cognito:groups is an array containing Admins", () => {
      const event = createFakeEventWithClaims({
        "cognito:groups": ["Users", "Admins", "Moderators"],
      });
      expect(isAdmin(event)).toBe(true);
    });

    it("returns false when cognito:groups is an array that does not contain Admins", () => {
      const event = createFakeEventWithClaims({
        "cognito:groups": ["Users", "Moderators"],
      });
      expect(isAdmin(event)).toBe(false);
    });

    it("returns true when cognito:groups is a comma-separated string containing Admins", () => {
      const event = createFakeEventWithClaims({
        "cognito:groups": "Users,Admins,Moderators",
      });
      expect(isAdmin(event)).toBe(true);
    });

    it("returns true when cognito:groups is a space-separated string containing Admins", () => {
      const event = createFakeEventWithClaims({
        "cognito:groups": "Users Admins Moderators",
      });
      expect(isAdmin(event)).toBe(true);
    });

    it("returns true when cognito:groups is a literal string wrapped in square brackets containing Admins", () => {
      const event = createFakeEventWithClaims({
        "cognito:groups": "[Admins]",
      });
      expect(isAdmin(event)).toBe(true);
    });

    it("returns false when cognito:groups is a string that does not contain Admins", () => {
      const event = createFakeEventWithClaims({
        "cognito:groups": "Users,Moderators",
      });
      expect(isAdmin(event)).toBe(false);
    });

    it("returns false when cognito:groups is an invalid data type", () => {
      const event = createFakeEventWithClaims({
        "cognito:groups": 12345,
      });
      expect(isAdmin(event)).toBe(false);
    });
  });

  describe("getUser", () => {
    it("returns null when request context lacks claims", () => {
      const event = {} as JwtEvent;
      expect(getUser(event)).toBeNull();
    });

    it("returns the sub identifier when it is a valid string", () => {
      const event = createFakeEventWithClaims({ sub: "user-123-abc" });
      expect(getUser(event)).toBe("user-123-abc");
    });

    it("returns null when sub identifier is present but is not a string", () => {
      const event = createFakeEventWithClaims({ sub: 12345 });
      expect(getUser(event)).toBeNull();
    });
  });

  describe("getOwnerEmail", () => {
    it("returns null when request context lacks claims", () => {
      const event = {} as JwtEvent;
      expect(getOwnerEmail(event)).toBeNull();
    });

    it("returns the email value when it is a valid string", () => {
      const event = createFakeEventWithClaims({ email: "user@example.com" });
      expect(getOwnerEmail(event)).toBe("user@example.com");
    });

    it("returns null when email is present but is not a string", () => {
      const event = createFakeEventWithClaims({ email: true });
      expect(getOwnerEmail(event)).toBeNull();
    });
  });

  describe("verifyOrigin", () => {
    it("returns false and logs an error when ORIGIN_VERIFY_SECRET environment variable is missing", () => {
      delete process.env.ORIGIN_VERIFY_SECRET;
      const event = {
        headers: { "x-origin-verify": "secret-token" },
      } as unknown as APIGatewayProxyEventV2;

      const result = verifyOrigin(event);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("ORIGIN_VERIFY_SECRET is not set");
    });

    it("returns false when the incoming x-origin-verify header does not match the secret", () => {
      process.env.ORIGIN_VERIFY_SECRET = "expected-secret-token";
      const event = {
        headers: { "x-origin-verify": "incorrect-token" },
      } as unknown as APIGatewayProxyEventV2;

      expect(verifyOrigin(event)).toBe(false);
    });

    it("returns true when the incoming x-origin-verify header perfectly matches the secret", () => {
      process.env.ORIGIN_VERIFY_SECRET = "expected-secret-token";
      const event = {
        headers: { "x-origin-verify": "expected-secret-token" },
      } as unknown as APIGatewayProxyEventV2;

      expect(verifyOrigin(event)).toBe(true);
    });

    it("is case-sensitive and returns false if the match is not exact", () => {
      process.env.ORIGIN_VERIFY_SECRET = "Expected-Secret-Token";
      const event = {
        headers: { "x-origin-verify": "expected-secret-token" },
      } as unknown as APIGatewayProxyEventV2;

      expect(verifyOrigin(event)).toBe(false);
    });
  });
});