import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("drizzle-orm", () => ({
  asc: vi.fn((column: unknown) => ({ direction: "asc", column })),
}));

vi.mock("../../database/drizzle/schema", () => ({
  approvals: {
    createdAt: "approvals.createdAt",
  },
}));

vi.mock("../helpers/db", () => ({
  getDatabase: vi.fn(),
}));

vi.mock("../helpers/auth", () => ({
  verifyOrigin: vi.fn(),
  isAdmin: vi.fn(),
}));

import { getDatabase } from "../helpers/db";
import { verifyOrigin, isAdmin } from "../helpers/auth";

const fakeEvent = {} as APIGatewayProxyEventV2;

interface MockDbSpies {
  select: any;
  from: any;
  orderBy: any;
}

interface MockDbResult {
  db: {
    select: any;
  };
  spies: MockDbSpies;
}

function makeMockDb(selectResults: unknown[]): MockDbResult {
  const orderBy = vi.fn().mockResolvedValue(selectResults);
  const from = vi.fn(() => ({ orderBy }));
  const select = vi.fn(() => ({ from }));

  return {
    db: { select },
    spies: { select, from, orderBy },
  };
}

async function loadHandler() {
  const mod = await import("../getPendingCommunities");
  return mod.handler;
}

describe("get pending approvals handler", () => {
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
      expect(isAdmin).not.toHaveBeenCalled();
      expect(getDatabase).not.toHaveBeenCalled();
    });
  });

  describe("Admin Authorization", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("returns 403 when the user is not an administrator", async () => {
      vi.mocked(isAdmin).mockResolvedValue(false);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Forbidden: Admin group access required",
      });
      expect(getDatabase).not.toHaveBeenCalled();
    });
  });

  describe("Query Execution", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(isAdmin).mockResolvedValue(true);
    });

    it("returns 200 and a list of pending requests sorted by creation date", async () => {
      const mockApprovals = [
        { id: "req-1", name: "Early Community", status: "pending" },
        { id: "req-2", name: "Later Community", status: "pending" },
      ];

      const { db, spies } = makeMockDb(mockApprovals);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body as string)).toEqual(mockApprovals);

      expect(spies.select).toHaveBeenCalled();
      expect(spies.from).toHaveBeenCalledWith({ createdAt: "approvals.createdAt" });
      expect(spies.orderBy).toHaveBeenCalledWith({
        direction: "asc",
        column: "approvals.createdAt",
      });
    });

    it("returns 200 with an empty array when no pending approvals exist", async () => {
      const { db } = makeMockDb([]);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body as string)).toEqual([]);
    });
  });

  describe("System & Database Error Handling", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
      vi.mocked(isAdmin).mockResolvedValue(true);
    });

    it("returns 500 when database connectivity fails", async () => {
      vi.mocked(getDatabase).mockRejectedValue(new Error("Database connection lost"));

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Internal Server Error",
      });
      expect(console.error).toHaveBeenCalled();
    });
  });
});