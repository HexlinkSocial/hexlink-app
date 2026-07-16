import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
  and: vi.fn((...conditions: unknown[]) => ({ conditions })),
}));

vi.mock("../../database/drizzle/schema", () => ({
  approvals: {
    id: "approvals.id",
    name: "approvals.name",
    owner: "approvals.owner",
    ownerEmail: "approvals.ownerEmail",
    status: "approvals.status",
    comments: "approvals.comments",
    lastEdited: "approvals.lastEdited",
  },
  communities: {
    id: "communities.id",
    name: "communities.name",
    owner: "communities.owner",
  },
  cellCommunities: {
    cellId: "cellCommunities.cellId",
    communityId: "cellCommunities.communityId",
  },
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
  update: any;
  updateSet: any;
  updateWhere: any;
  insert: any;
  insertValues: any;
  insertReturning: any;
  transaction: any;
}

interface MockDbResult {
  db: {
    select: any;
    transaction: any;
  };
  tx: {
    update: any;
    insert: any;
  };
  spies: MockDbSpies;
}

function makeMockDb(
  approvalResults: unknown[],
  communityResults: unknown[],
  cellResults: unknown[] = []
): MockDbResult {
  let selectCallCount = 0;
  const selectWhere = vi.fn(() => {
    selectCallCount += 1;
    if (selectCallCount === 1) {
      return Promise.resolve(approvalResults);
    }
    if (selectCallCount === 2) {
      return Promise.resolve(communityResults);
    }
    return Promise.resolve(cellResults);
  });
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  const updateWhere = vi.fn(() => Promise.resolve(undefined));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  const insertReturning = vi.fn(() => Promise.resolve([baseApproval]));
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const tx = { update, insert };

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
      update,
      updateSet,
      updateWhere,
      insert,
      insertValues,
      insertReturning,
      transaction,
    },
  };
}

async function loadHandler() {
  const mod = await import("../editCommunity");
  return mod.handler;
}

describe("edit community handler", () => {
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

    it("returns 401 if owner email is not resolved", async () => {
      vi.mocked(getOwnerEmail).mockResolvedValue(null);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Unauthorized: Invalid or missing token claims",
      });
    });
  });

  describe("Payload Validation", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
    });

    it("returns 400 when request body is completely missing", async () => {
      vi.mocked(getRequestBody).mockReturnValue(null as any);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Invalid request body.",
      });
    });

    it("returns 400 when community id or name is missing", async () => {
      vi.mocked(getRequestBody).mockReturnValue({ name: "A Cool Community" });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body as string);
      expect(body.error).toContain("Missing fields.");
    });

    it("returns 400 when name length exceeds 100 characters", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        id: "community-1",
        name: "a".repeat(101),
      });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Community name cannot exceed 100 characters.",
      });
    });

    it("returns 400 when description length exceeds 3000 characters", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        id: "community-1",
        name: "A Cool Community",
        description: "a".repeat(3001),
      });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Description cannot exceed 3000 characters.",
      });
    });
  });

  describe("Workflows & Executions", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
      vi.mocked(getUser).mockResolvedValue("owner-123");
    });

    it("updates existing approval and sets it to pending when approval already exists", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        id: "community-1",
        name: "Updated Name",
        description: "New description",
        whatsapp: "https://wa.me/123",
      });

      const { db, spies } = makeMockDb([baseApproval], [baseCommunity]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body as string)).toEqual({
        message: "Existing approval request updated and reset to pending status",
      });

      expect(spies.update).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalledWith({
        to: "user@example.com",
        subject: "Community Edit Submitted: Updated Name",
        templateName: "communityEditSubmitted",
        variables: {
          communityName: "Updated Name",
          frontendUrl: "https://app.example.com",
        },
      });
    });

    it("creates a new approval request when production community exists but no approval does", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        id: "community-1",
        name: "New Proposed Name",
      });

      const cellRecords = [{ cellId: "cell-a" }, { cellId: "cell-b" }];
      const { db, spies } = makeMockDb([], [baseCommunity], cellRecords);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(201);
      const parsedBody = JSON.parse(result.body as string);
      expect(parsedBody.message).toContain("Community edit submission routed to approvals workflow");
      expect(parsedBody.approval).toBeDefined();

      expect(spies.insert).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalledWith({
        to: "user@example.com",
        subject: "Community Edit Submitted: New Proposed Name",
        templateName: "communityEditSubmitted",
        variables: {
          communityName: "New Proposed Name",
          frontendUrl: "https://app.example.com",
        },
      });
    });

    it("returns 404 when neither approval nor production records are found", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        id: "community-1",
        name: "New Proposed Name",
      });

      const { db } = makeMockDb([], []);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Target community or approval sequence reference not found, or you do not have permission to access it",
      });
    });
  });

  describe("System & Database Error Handling", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(getOwnerEmail).mockResolvedValue("user@example.com");
      vi.mocked(getUser).mockResolvedValue("owner-123");
      vi.mocked(getRequestBody).mockReturnValue({
        id: "community-1",
        name: "Name",
      });
    });

    it("returns 500 when database connectivity fails", async () => {
      vi.mocked(getDatabase).mockRejectedValue(new Error("Network connection lost"));

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Internal Server Error",
      });
    });
  });
});