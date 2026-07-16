import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("../../database/drizzle/schema", () => ({
  approvals: { id: "approvals.id" },
}));

vi.mock("../helpers/request", () => ({
  getRequestBody: vi.fn(),
}));

vi.mock("../helpers/ses", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("../helpers/db", () => ({
  getDatabase: vi.fn(),
}));

vi.mock("../helpers/auth", () => ({
  getUser: vi.fn(),
  getOwnerEmail: vi.fn(),
  verifyOrigin: vi.fn(),
}));

vi.mock("../helpers/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

import { getRequestBody } from "../helpers/request";
import { sendEmail } from "../helpers/ses";
import { getDatabase } from "../helpers/db";
import { getUser, getOwnerEmail, verifyOrigin } from "../helpers/auth";
import { verifyTurnstileToken } from "../helpers/turnstile";

const fakeEvent = {
  headers: {},
} as APIGatewayProxyEventV2;

const baseApproval = {
  id: "approval-1",
  name: "Test Community",
  description: "A wonderful place for developers",
  owner: "user-123",
  ownerEmail: "user@example.com",
  whatsapp: null,
  discord: null,
  facebook: null,
  other: null,
  cellIds: ["cell-1", "cell-2"],
  status: "pending",
};

interface MockDbSpies {
  insert: any;
  insertValues: any;
  insertReturning: any;
}

interface MockDbResult {
  db: {
    insert: any;
  };
  spies: MockDbSpies;
}

function makeMockDb(insertedRecord: unknown): MockDbResult {
  const insertReturning = vi.fn(() => Promise.resolve([insertedRecord]));
  const insertValues = vi.fn(() => ({
    returning: insertReturning,
  }));
  const insert = vi.fn(() => ({
    values: insertValues,
  }));

  return {
    db: { insert },
    spies: {
      insert,
      insertValues,
      insertReturning,
    },
  };
}

async function loadHandler() {
  const mod = await import("../createCommunity");
  return mod.handler;
}

describe("community submission handler", () => {
  const ORIGINAL_ENV = { ...process.env };
  let handler: Awaited<ReturnType<typeof loadHandler>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    vi.spyOn(console, "error").mockImplementation(() => {});
    handler = await loadHandler();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  describe("Origin Verification", () => {
    it("returns 403 when origin verification fails", async () => {
      vi.mocked(verifyOrigin).mockReturnValue(false);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Forbidden",
      });
      expect(verifyTurnstileToken).not.toHaveBeenCalled();
    });
  });

  describe("Security Token & Captcha Verification", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("returns 400 when captcha token is missing and NODE_ENV is not development", async () => {
      process.env.NODE_ENV = "production";
      const eventWithNoHeaders = { headers: {} } as APIGatewayProxyEventV2;

      const result = await handler(eventWithNoHeaders);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Security validation token is missing from headers.",
      });
    });

    it("bypasses missing captcha token validation if in development mode", async () => {
      process.env.NODE_ENV = "development";
      vi.mocked(getUser).mockResolvedValue("user-123");
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
      vi.mocked(getRequestBody).mockReturnValue({
        name: "Dev Comm",
        cellIds: ["cell-1"],
      });
      const { db } = makeMockDb(baseApproval);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler({ headers: {} } as APIGatewayProxyEventV2);

      expect(result.statusCode).toBe(201);
      expect(verifyTurnstileToken).not.toHaveBeenCalled();
    });

    it("evaluates x-captcha-token in lowercase casing and rejects invalid token", async () => {
      process.env.NODE_ENV = "production";
      const event = {
        headers: { "x-captcha-token": "bad-token" },
      } as unknown as APIGatewayProxyEventV2;
      vi.mocked(verifyTurnstileToken).mockResolvedValue(false);

      const result = await handler(event);

      expect(verifyTurnstileToken).toHaveBeenCalledWith("bad-token");
      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Security validation failed. Automated bot activity detected.",
      });
    });

    it("evaluates X-Captcha-Token in PascalCase casing and rejects invalid token", async () => {
      process.env.NODE_ENV = "production";
      const event = {
        headers: { "X-Captcha-Token": "bad-token" },
      } as unknown as APIGatewayProxyEventV2;
      vi.mocked(verifyTurnstileToken).mockResolvedValue(false);

      const result = await handler(event);

      expect(verifyTurnstileToken).toHaveBeenCalledWith("bad-token");
      expect(result.statusCode).toBe(403);
    });
  });

  describe("User Authentication", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      process.env.NODE_ENV = "development";
    });

    it("returns 401 if owner user details cannot be fetched", async () => {
      vi.mocked(getUser).mockResolvedValue(null);
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Unauthorized. Missing or invalid session token.",
      });
    });

    it("returns 401 if owner email details cannot be fetched", async () => {
      vi.mocked(getUser).mockResolvedValue("user-123");
      vi.mocked(getOwnerEmail).mockResolvedValue(null);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Unauthorized. Missing or invalid session token.",
      });
    });
  });

  describe("Payload Validation", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      process.env.NODE_ENV = "development";
      vi.mocked(getUser).mockResolvedValue("user-123");
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
    });

    it("returns 400 when name is missing", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        cellIds: ["cell-1"],
      });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Missing fields. 'name' and a non-empty array of 'cellIds' are required.",
      });
    });

    it("returns 400 when cellIds is missing", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        name: "My Community",
      });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
    });

    it("returns 400 when cellIds is empty", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        name: "My Community",
        cellIds: [],
      });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
    });

    it("returns 400 when cellIds array has more than 50 elements", async () => {
      const excessCellIds = Array.from({ length: 51 }, (_, i) => `cell-${i}`);
      vi.mocked(getRequestBody).mockReturnValue({
        name: "My Community",
        cellIds: excessCellIds,
      });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "A maximum of 50 cell IDs is allowed.",
      });
    });

    it("returns 400 when name exceeds 100 characters", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        name: "A".repeat(101),
        cellIds: ["cell-1"],
      });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Community name cannot exceed 100 characters.",
      });
    });

    it("returns 400 when description exceeds 3000 characters", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        name: "Valid Name",
        description: "B".repeat(3001),
        cellIds: ["cell-1"],
      });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Description cannot exceed 3000 characters.",
      });
    });

    it("accepts an undefined or null description", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        name: "Valid Name",
        description: undefined,
        cellIds: ["cell-1"],
      });
      const { db } = makeMockDb(baseApproval);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(201);
    });
  });

  describe("Database Persistence & Messaging Workflow", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      process.env.NODE_ENV = "production";
      vi.mocked(verifyTurnstileToken).mockResolvedValue(true);
      vi.mocked(getUser).mockResolvedValue("user-123");
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
      process.env.FRONTEND_URL = "https://app.example.com";
    });

    it("inserts community submission record with sanitized optional fields and sends confirmation email", async () => {
      const event = {
        headers: { "x-captcha-token": "good-token" },
      } as unknown as APIGatewayProxyEventV2;

      const payload = {
        name: "My Community",
        description: "A great place",
        whatsapp: "https://wa.me/123",
        cellIds: ["cell-1"],
      };

      vi.mocked(getRequestBody).mockReturnValue(payload);

      const { db, spies } = makeMockDb(baseApproval);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(event);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body as string)).toEqual({
        message: "Community submission routed to approvals workflow",
        approval: baseApproval,
      });

      expect(spies.insertValues).toHaveBeenCalledWith({
        name: "My Community",
        description: "A great place",
        owner: "user-123",
        ownerEmail: "user@example.com",
        whatsapp: "https://wa.me/123",
        discord: null,
        facebook: null,
        other: null,
        cellIds: ["cell-1"],
        status: "pending",
      });

      expect(sendEmail).toHaveBeenCalledWith({
        to: "user@example.com",
        subject: "Community Submission Confirmation",
        templateName: "communitySubmissionConfirmation",
        variables: {
          communityName: "My Community",
          frontendUrl: "https://app.example.com",
        },
      });
    });

    it("uses empty fallback string for frontend URL if the environment variable is missing", async () => {
      delete process.env.FRONTEND_URL;

      vi.mocked(getRequestBody).mockReturnValue({
        name: "Fallback URL Test",
        cellIds: ["cell-1"],
      });

      const { db } = makeMockDb(baseApproval);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const event = {
        headers: { "x-captcha-token": "good-token" },
      } as unknown as APIGatewayProxyEventV2;

      const result = await handler(event);

      expect(result.statusCode).toBe(201);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            communityName: "Fallback URL Test",
            frontendUrl: "",
          },
        }),
      );
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      process.env.NODE_ENV = "development";
      vi.mocked(getUser).mockResolvedValue("user-123");
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
      vi.mocked(getRequestBody).mockReturnValue({
        name: "Erroneous Community",
        cellIds: ["cell-1"],
      });
    });

    it("returns 500 when database connectivity throws", async () => {
      vi.mocked(getDatabase).mockRejectedValue(new Error("Postgres connection timeout"));

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Internal Server Error",
      });
    });

    it("returns 500 and catches arbitrary non-error exceptions silently", async () => {
      vi.mocked(getDatabase).mockImplementation(() => {
        throw "Raw string database break";
      });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Internal Server Error",
      });
    });
  });
});