import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
}));

vi.mock("../../database/drizzle/schema", () => ({   
  approvals: { id: "approvals.id" },
  communities: { id: "communities.id" },
  cellCommunities: {},
  tileGenerationState: { id: "tileGenerationState.id" },
}));

vi.mock("../helpers/request", () => ({
  getRequestBody: vi.fn(),
}));

vi.mock("../helpers/auth", () => ({
  isAdmin: vi.fn(),
  verifyOrigin: vi.fn(),
}));

vi.mock("../helpers/ses", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("../helpers/db", () => ({
  getDatabase: vi.fn(),
}));

import { getRequestBody } from "../helpers/request";
import { isAdmin, verifyOrigin } from "../helpers/auth";
import { sendEmail } from "../helpers/ses";
import { getDatabase } from "../helpers/db";

const fakeEvent = {} as APIGatewayProxyEventV2;

const baseApproval = {
  id: "approval-1",
  name: "Test Community",
  description: "A test community",
  owner: "owner-1",
  ownerEmail: "owner@example.com",
  whatsapp: null,
  discord: null,
  facebook: null,
  other: null,
  cellIds: ["cell-1", "cell-2"],
  status: "pending",
  comments: null,
};

function makeApproval(overrides: Partial<typeof baseApproval> = {}) {
  return { ...baseApproval, ...overrides };
}

interface MockDbSpies {
  select: any;
  selectFrom: any;
  selectWhere: any;
  insert: any;
  insertValues: any;
  insertOnConflictDoUpdate: any;
  insertOnConflictDoNothing: any;
  insertReturning: any;
  del: any;
  deleteWhere: any;
  update: any;
  updateSet: any;
  updateWhere: any;
  transaction: any;
}

interface MockDbResult {
  db: {
    select: any;
    transaction: any;
  };
  tx: {
    insert: any;
    delete: any;
    update: any;
  };
  spies: MockDbSpies;
}

function makeMockDb(selectResult: unknown[]): MockDbResult {
  const selectWhere = vi.fn(() => Promise.resolve(selectResult));
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  const insertReturning = vi.fn(() =>
    Promise.resolve([{ id: baseApproval.id }]),
  );
  const insertOnConflictDoUpdate = vi.fn(() => ({
    returning: insertReturning,
  }));
  const insertOnConflictDoNothing = vi.fn(() => Promise.resolve(undefined));
  const insertValues = vi.fn(() => ({
    onConflictDoUpdate: insertOnConflictDoUpdate,
    onConflictDoNothing: insertOnConflictDoNothing,
  }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const deleteWhere = vi.fn(() => Promise.resolve(undefined));
  const del = vi.fn(() => ({ where: deleteWhere }));

  const updateWhere = vi.fn(() => Promise.resolve(undefined));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set: updateSet }));

  const tx = { insert, delete: del, update };

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
      insert,
      insertValues,
      insertOnConflictDoUpdate,
      insertOnConflictDoNothing,
      insertReturning,
      del,
      deleteWhere,
      update,
      updateSet,
      updateWhere,
      transaction,
    },
  };
}

async function loadHandler() {
  const mod = await import("../approveOrDenyCommunity");
  return mod.handler;
}

describe("approvals handler", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  describe("with FRONTEND_URL configured", () => {
    let handler: Awaited<ReturnType<typeof loadHandler>>;

    beforeEach(async () => {
      vi.resetModules();
      vi.clearAllMocks();
      process.env.FRONTEND_URL = "https://example.com";
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(isAdmin).mockResolvedValue(true);
      handler = await loadHandler();
    });

    it("returns 403 when origin verification fails", async () => {
      vi.mocked(verifyOrigin).mockReturnValue(false);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Forbidden",
      });
      expect(isAdmin).not.toHaveBeenCalled();
    });

    it("returns 403 when the caller is not an admin", async () => {
      vi.mocked(isAdmin).mockResolvedValue(false);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Forbidden: Admin group access required",
      });
      expect(getRequestBody).not.toHaveBeenCalled();
    });

    it("returns 400 when 'id' is missing", async () => {
      vi.mocked(getRequestBody).mockReturnValue({ action: "approve" });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Missing required properties: 'id' and 'action'",
      });
    });

    it("returns 400 when 'action' is missing", async () => {
      vi.mocked(getRequestBody).mockReturnValue({ id: "approval-1" });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Missing required properties: 'id' and 'action'",
      });
    });

    it("returns 400 when both 'id' and 'action' are missing", async () => {
      vi.mocked(getRequestBody).mockReturnValue({});

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
    });

    it("returns 404 when the approval record does not exist", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        id: "missing-id",
        action: "approve",
      });
      const { db } = makeMockDb([]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Approval request record not found",
      });
    });

    it("returns 400 for an invalid/unknown action", async () => {
      const approval = makeApproval();
      vi.mocked(getRequestBody).mockReturnValue({
        id: approval.id,
        action: "explode",
      });
      const { db } = makeMockDb([approval]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Invalid action provided",
      });
    });

    describe("action: approve", () => {
      it("creates/updates the community, links cells, updates tile flag, deletes the approval, and emails the owner", async () => {
        const approval = makeApproval();
        vi.mocked(getRequestBody).mockReturnValue({
          id: approval.id,
          action: "approve",
        });
        const { db, spies } = makeMockDb([approval]);
        vi.mocked(getDatabase).mockResolvedValue(db as never);

        const result = await handler(fakeEvent);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body as string)).toEqual({
          message: "Action 'approve' applied successfully",
        });

        expect(spies.insert).toHaveBeenCalledWith(
          expect.objectContaining({ id: "communities.id" }),
        );
        expect(spies.insertValues).toHaveBeenCalledWith(
          expect.objectContaining({
            id: approval.id,
            name: approval.name,
            owner: approval.owner,
          }),
        );

        expect(spies.insertValues).toHaveBeenCalledWith([
          { cellId: "cell-1", communityId: approval.id },
          { cellId: "cell-2", communityId: approval.id },
        ]);
        expect(spies.insertOnConflictDoNothing).toHaveBeenCalled();

        expect(spies.insert).toHaveBeenCalledWith(
          expect.objectContaining({ id: "tileGenerationState.id" }),
        );
        expect(spies.insertValues).toHaveBeenCalledWith({
          id: "singleton",
          newCommunitiesAdded: true,
        });
        expect(spies.insertOnConflictDoUpdate).toHaveBeenCalledTimes(2);

        expect(spies.del).toHaveBeenCalledWith(
          expect.objectContaining({ id: "approvals.id" }),
        );

        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: approval.ownerEmail,
            templateName: "communityApproved",
            variables: expect.objectContaining({
              communityName: approval.name,
              frontendUrl: "https://example.com",
            }),
          }),
        );
      });

      it("does not insert cell-community join rows when cellIds is empty", async () => {
        const approval = makeApproval({ cellIds: [] });
        vi.mocked(getRequestBody).mockReturnValue({
          id: approval.id,
          action: "approve",
        });
        const { db, spies } = makeMockDb([approval]);
        vi.mocked(getDatabase).mockResolvedValue(db as never);

        const result = await handler(fakeEvent);

        expect(result.statusCode).toBe(200);
        expect(spies.insert).toHaveBeenCalledTimes(2);
      });

      it("does not send an email when ownerEmail is null", async () => {
        const approval = makeApproval({ ownerEmail: undefined });
        vi.mocked(getRequestBody).mockReturnValue({
          id: approval.id,
          action: "approve",
        });
        const { db } = makeMockDb([approval]);
        vi.mocked(getDatabase).mockResolvedValue(db as never);

        const result = await handler(fakeEvent);

        expect(result.statusCode).toBe(200);
        expect(sendEmail).not.toHaveBeenCalled();
      });

      it("rolls the whole request into a 500 if the transaction throws unexpectedly", async () => {
        const approval = makeApproval();
        vi.mocked(getRequestBody).mockReturnValue({
          id: approval.id,
          action: "approve",
        });
        const { db } = makeMockDb([approval]);
        vi.mocked(getDatabase).mockResolvedValue(db as never);
        vi.mocked(sendEmail).mockRejectedValueOnce(new Error("SES is down"));

        const result = await handler(fakeEvent);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body as string)).toEqual({
          error: "SES is down",
        });
      });
    });

    // -----------------------------------------------------------------
    // reject
    // -----------------------------------------------------------------

    describe("action: reject", () => {
      it("deletes the approval and emails the owner", async () => {
        const approval = makeApproval();
        vi.mocked(getRequestBody).mockReturnValue({
          id: approval.id,
          action: "reject",
        });
        const { db, spies } = makeMockDb([approval]);
        vi.mocked(getDatabase).mockResolvedValue(db as never);

        const result = await handler(fakeEvent);

        expect(result.statusCode).toBe(200);
        expect(spies.del).toHaveBeenCalledWith(
          expect.objectContaining({ id: "approvals.id" }),
        );
        expect(spies.insert).not.toHaveBeenCalled();
        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: approval.ownerEmail,
            templateName: "communityDenied",
            variables: { communityName: approval.name },
          }),
        );
      });

      it("does not send an email when ownerEmail is null", async () => {
        const approval = makeApproval({ ownerEmail: undefined });
        vi.mocked(getRequestBody).mockReturnValue({
          id: approval.id,
          action: "reject",
        });
        const { db } = makeMockDb([approval]);
        vi.mocked(getDatabase).mockResolvedValue(db as never);

        const result = await handler(fakeEvent);

        expect(result.statusCode).toBe(200);
        expect(sendEmail).not.toHaveBeenCalled();
      });
    });

    // -----------------------------------------------------------------
    // amend
    // -----------------------------------------------------------------

    describe("action: amend", () => {
      it("returns 400 when comments are missing", async () => {
        const approval = makeApproval();
        vi.mocked(getRequestBody).mockReturnValue({
          id: approval.id,
          action: "amend",
        });
        const { db, spies } = makeMockDb([approval]);
        vi.mocked(getDatabase).mockResolvedValue(db as never);

        const result = await handler(fakeEvent);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body as string)).toEqual({
          error: "Comments required for amendments",
        });
        expect(spies.update).not.toHaveBeenCalled();
      });

      it("returns 400 when comments is an empty string", async () => {
        const approval = makeApproval();
        vi.mocked(getRequestBody).mockReturnValue({
          id: approval.id,
          action: "amend",
          comments: "",
        });
        const { db } = makeMockDb([approval]);
        vi.mocked(getDatabase).mockResolvedValue(db as never);

        const result = await handler(fakeEvent);

        expect(result.statusCode).toBe(400);
      });

      it("updates the approval status and emails the owner with comments", async () => {
        const approval = makeApproval();
        vi.mocked(getRequestBody).mockReturnValue({
          id: approval.id,
          action: "amend",
          comments: "Please add more detail",
        });
        const { db, spies } = makeMockDb([approval]);
        vi.mocked(getDatabase).mockResolvedValue(db as never);

        const result = await handler(fakeEvent);

        expect(result.statusCode).toBe(200);
        expect(spies.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "approvals.id" }),
        );
        expect(spies.updateSet).toHaveBeenCalledWith({
          status: "amendments_requested",
          comments: "Please add more detail",
        });
        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: approval.ownerEmail,
            templateName: "communityAmendments",
            variables: expect.objectContaining({
              communityName: approval.name,
              frontendUrl: "https://example.com",
              comments: "Please add more detail",
            }),
          }),
        );
      });

      it("does not send an email when ownerEmail is null", async () => {
        const approval = makeApproval({ ownerEmail: undefined });
        vi.mocked(getRequestBody).mockReturnValue({
          id: approval.id,
          action: "amend",
          comments: "Needs work",
        });
        const { db } = makeMockDb([approval]);
        vi.mocked(getDatabase).mockResolvedValue(db as never);

        const result = await handler(fakeEvent);

        expect(result.statusCode).toBe(200);
        expect(sendEmail).not.toHaveBeenCalled();
      });
    });

    it("returns 500 with a generic message when the thrown error has no message", async () => {
      const approval = makeApproval();
      vi.mocked(getRequestBody).mockReturnValue({
        id: approval.id,
        action: "approve",
      });
      const { db } = makeMockDb([approval]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);
      vi.mocked(sendEmail).mockImplementationOnce(() => {
        throw "boom";
      });

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Internal Server Error",
      });
    });

    it("returns 500 when getDatabase itself throws", async () => {
      vi.mocked(getRequestBody).mockReturnValue({
        id: "approval-1",
        action: "approve",
      });
      vi.mocked(getDatabase).mockRejectedValue(new Error("DB unavailable"));

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "DB unavailable",
      });
    });

    it("classifies an error message containing 'Invalid' (mixed case) as a client error", async () => {
      const approval = makeApproval();
      vi.mocked(getRequestBody).mockReturnValue({
        id: approval.id,
        action: "not-a-real-action",
      });
      const { db } = makeMockDb([approval]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(400);
    });
  });

  describe("with FRONTEND_URL not configured", () => {
    let handler: Awaited<ReturnType<typeof loadHandler>>;

    beforeEach(async () => {
      vi.resetModules();
      vi.clearAllMocks();
      delete process.env.FRONTEND_URL;
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(isAdmin).mockResolvedValue(true);
      handler = await loadHandler();
    });

    it("does not send an approval email even if ownerEmail is present", async () => {
      const approval = makeApproval();
      vi.mocked(getRequestBody).mockReturnValue({
        id: approval.id,
        action: "approve",
      });
      const { db } = makeMockDb([approval]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("does not send an amendments email even if ownerEmail is present", async () => {
      const approval = makeApproval();
      vi.mocked(getRequestBody).mockReturnValue({
        id: approval.id,
        action: "amend",
        comments: "fix this",
      });
      const { db } = makeMockDb([approval]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("still sends a rejection email (reject does not depend on FRONTEND_URL)", async () => {
      const approval = makeApproval();
      vi.mocked(getRequestBody).mockReturnValue({
        id: approval.id,
        action: "reject",
      });
      const { db } = makeMockDb([approval]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ templateName: "communityDenied" }),
      );
    });
  });
});