import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
  and: vi.fn((...conditions: unknown[]) => ({ conditions })),
}));

vi.mock("../../database/drizzle/schema", () => ({
  approvals: { id: "approvals.id", name: "approvals.name", owner: "approvals.owner" },
  communities: { id: "communities.id", name: "communities.name", owner: "communities.owner" },
  tileGenerationState: { id: "tileGenerationState.id" },
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

import { getRequestBody } from "../helpers/request";
import { sendEmail } from "../helpers/ses";
import { getDatabase } from "../helpers/db";
import { getUser, getOwnerEmail, verifyOrigin } from "../helpers/auth";

const fakeEvent = {} as APIGatewayProxyEventV2;

const baseApproval = {
  id: "community-1",
  name: "Approval Community Name",
  owner: "owner-123",
};

const baseCommunity = {
  id: "community-1",
  name: "Production Community Name",
  owner: "owner-123",
};

interface MockDbSpies {
  select: any;
  selectFrom: any;
  selectWhere: any;
  del: any;
  deleteWhere: any;
  insert: any;
  insertValues: any;
  onConflictDoUpdate: any;
  transaction: any;
}

interface MockDbResult {
  db: {
    select: any;
    transaction: any;
  };
  tx: {
    delete: any;
    insert: any;
  };
  spies: MockDbSpies;
}

function makeMockDb(
  approvalResults: unknown[],
  communityResults: unknown[]
): MockDbResult {
  let callCount = 0;
  const selectWhere = vi.fn(() => {
    callCount += 1;
    if (callCount === 1) {
      return Promise.resolve(approvalResults);
    }
    return Promise.resolve(communityResults);
  });
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  const deleteWhere = vi.fn(() => Promise.resolve(undefined));
  const del = vi.fn(() => ({ where: deleteWhere }));

  const onConflictDoUpdate = vi.fn(() => Promise.resolve(undefined));
  const insertValues = vi.fn(() => ({ onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const tx = { delete: del, insert };
  const transaction = vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
    await cb(tx);
  });

  const db = { select, transaction };

  return {
    db,
    tx,
    spies: {
      select,
      selectFrom,
      selectWhere,
      del,
      deleteWhere,
      insert,
      insertValues,
      onConflictDoUpdate,
      transaction,
    },
  };
}

async function loadHandler() {
  const mod = await import("../deleteCommunity");
  return mod.handler;
}

describe("delete community handler", () => {
  const ORIGINAL_ENV = { ...process.env };
  let handler: Awaited<ReturnType<typeof loadHandler>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    process.env.FRONTEND_URL = "https://app.example.com";
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
      expect(getUser).not.toHaveBeenCalled();
    });
  });

  describe("User Authentication", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("returns 401 if user session context is incomplete", async () => {
      vi.mocked(getUser).mockResolvedValue(null);
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Unauthorized: Invalid or missing token claims",
      });
    });

    it("returns 401 if owner email is not resolved", async () => {
      vi.mocked(getUser).mockResolvedValue("owner-123");
      vi.mocked(getOwnerEmail).mockResolvedValue(null);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(401);
    });
  });

  describe("Payload Validation", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(getUser).mockResolvedValue("owner-123");
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
    });

    it("returns 400 when community id is missing", async () => {
      vi.mocked(getRequestBody).mockReturnValue({ scope: "production" });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Missing required community 'id'.",
      });
    });

    it("returns 400 when scope is invalid", async () => {
      vi.mocked(getRequestBody).mockReturnValue({ id: "community-1", scope: "invalid_scope" });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Missing or invalid deletion 'scope' parameter. Expected 'approval' or 'production'.",
      });
    });
  });

  describe("Record Resolution & Permissions", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(getUser).mockResolvedValue("owner-123");
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
    });

    it("returns 404 when targeted community and approval entries do not exist", async () => {
      vi.mocked(getRequestBody).mockReturnValue({ id: "community-1", scope: "approval" });
      const { db } = makeMockDb([], []);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Target community record not found, or you do not have permission to delete it",
      });
    });
  });

  describe("Execution Workflows", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(getUser).mockResolvedValue("owner-123");
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
    });

    it("deletes both production and approval records when scope is production and both exist", async () => {
      vi.mocked(getRequestBody).mockReturnValue({ id: "community-1", scope: "production" });
      const { db, spies } = makeMockDb([baseApproval], [baseCommunity]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body as string)).toEqual({
        message: "Community (production) successfully deleted.",
      });

      expect(spies.del).toHaveBeenCalledTimes(2);
      expect(spies.insert).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith({
        to: "user@example.com",
        subject: "Community Removal Confirmation",
        templateName: "communityDeleted",
        variables: {
          communityName: "Production Community Name",
          frontendUrl: "https://app.example.com",
        },
      });
    });

    it("deletes only production record when scope is production and no approval record exists", async () => {
      vi.mocked(getRequestBody).mockReturnValue({ id: "community-1", scope: "production" });
      const { db, spies } = makeMockDb([], [baseCommunity]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(spies.del).toHaveBeenCalledTimes(1);
      expect(spies.insert).toHaveBeenCalledTimes(1);
    });

    it("deletes only approval record when scope is approval and both records exist", async () => {
      vi.mocked(getRequestBody).mockReturnValue({ id: "community-1", scope: "approval" });
      const { db, spies } = makeMockDb([baseApproval], [baseCommunity]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(spies.del).toHaveBeenCalledTimes(1);
      expect(spies.insert).not.toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            communityName: "Approval Community Name",
            frontendUrl: "https://app.example.com",
          },
        })
      );
    });

    it("falls back to approval name if production record is missing when scope is approval", async () => {
      vi.mocked(getRequestBody).mockReturnValue({ id: "community-1", scope: "approval" });
      const { db } = makeMockDb([baseApproval], []);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            communityName: "Approval Community Name",
            frontendUrl: "https://app.example.com",
          },
        })
      );
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(getUser).mockResolvedValue("owner-123");
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
      vi.mocked(getRequestBody).mockReturnValue({ id: "community-1", scope: "approval" });
    });

    it("returns 500 when database fails to load", async () => {
      vi.mocked(getDatabase).mockRejectedValue(new Error("DB Timeout"));

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Internal Server Error",
      });
    });
  });
});