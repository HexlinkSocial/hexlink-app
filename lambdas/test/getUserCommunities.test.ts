import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
}));

vi.mock("../../database/drizzle/schema", () => ({
  approvals: {
    owner: "approvals.owner",
  },
  communities: {
    owner: "communities.owner",
  },
}));

vi.mock("../helpers/db", () => ({
  getDatabase: vi.fn(),
}));

vi.mock("../helpers/auth", () => ({
  verifyOrigin: vi.fn(),
  getUser: vi.fn(),
}));

import { getDatabase } from "../helpers/db";
import { verifyOrigin, getUser } from "../helpers/auth";

const fakeEvent = {} as APIGatewayProxyEventV2;

interface MockDbSpies {
  select: any;
  from: any;
  where: any;
}

interface MockDbResult {
  db: {
    select: any;
  };
  spies: MockDbSpies;
}

function makeMockDb(approvalResults: unknown[], communityResults: unknown[]): MockDbResult {
  let selectCallCount = 0;
  const where = vi.fn(() => {
    selectCallCount += 1;
    if (selectCallCount === 1) {
      return Promise.resolve(approvalResults);
    }
    return Promise.resolve(communityResults);
  });
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  return {
    db: { select },
    spies: { select, from, where },
  };
}

async function loadHandler() {
  const mod = await import("../getUserCommunities");
  return mod.handler;
}

describe("get user entities handler", () => {
  let handler: Awaited<ReturnType<typeof loadHandler>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    handler = await loadHandler();
  });

  afterEach(() => {
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
      expect(getDatabase).not.toHaveBeenCalled();
    });
  });

  describe("User Authentication", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("returns 401 when the user ID is unresolved", async () => {
      vi.mocked(getUser).mockResolvedValue(null);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Unauthorized: Missing cognito sub identity context",
      });
      expect(getDatabase).not.toHaveBeenCalled();
    });
  });

  describe("Query Executions & Data Structuring", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(getUser).mockResolvedValue("user-123");
    });

    it("successfully queries both user approvals and production communities", async () => {
      const mockApprovals = [
        { id: "app-1", name: "Proposed Community", owner: "user-123" }
      ];
      const mockCommunities = [
        { id: "comm-1", name: "Active Community", owner: "user-123" }
      ];

      const { db, spies } = makeMockDb(mockApprovals, mockCommunities);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body as string);
      expect(body.approvals).toEqual(mockApprovals);
      expect(body.communities).toEqual(mockCommunities);

      expect(spies.select).toHaveBeenCalledTimes(2);
      expect(spies.where).toHaveBeenNthCalledWith(1, {
        column: "approvals.owner",
        value: "user-123",
      });
      expect(spies.where).toHaveBeenNthCalledWith(2, {
        column: "communities.owner",
        value: "user-123",
      });
    });

    it("returns empty arrays when the user has no entities", async () => {
      const { db } = makeMockDb([], []);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body as string)).toEqual({
        approvals: [],
        communities: [],
      });
    });
  });

  describe("System Error Handling", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(getUser).mockResolvedValue("user-123");
    });

    it("returns 500 when database connectivity fails", async () => {
      vi.mocked(getDatabase).mockRejectedValue(new Error("Database connection timed out"));

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Internal Server Error",
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
});