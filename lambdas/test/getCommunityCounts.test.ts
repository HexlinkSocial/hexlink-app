import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("drizzle-orm", () => ({
  count: vi.fn((column: unknown) => ({ countOf: column })),
}));

vi.mock("../../database/drizzle/schema", () => ({
  cellCommunities: {
    cellId: "cellCommunities.cellId",
  },
}));

vi.mock("../helpers/db", () => ({
  getDatabase: vi.fn(),
}));

vi.mock("../helpers/auth", () => ({
  verifyOrigin: vi.fn(),
}));

import { getDatabase } from "../helpers/db";
import { verifyOrigin } from "../helpers/auth";

const fakeEvent = {} as APIGatewayProxyEventV2;

interface MockDbSpies {
  select: any;
  from: any;
  groupBy: any;
}

interface MockDbResult {
  db: {
    select: any;
  };
  spies: MockDbSpies;
}

function makeMockDb(selectResults: unknown[]): MockDbResult {
  const groupBy = vi.fn().mockResolvedValue(selectResults);
  const from = vi.fn(() => ({ groupBy }));
  const select = vi.fn(() => ({ from }));

  return {
    db: { select },
    spies: { select, from, groupBy },
  };
}

async function loadHandler() {
  const mod = await import("../getCommunityCounts");
  return mod.handler;
}

describe("get communities count by cell ID handler", () => {
  let handler: Awaited<ReturnType<typeof loadHandler>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
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
      expect(getDatabase).not.toHaveBeenCalled();
    });
  });

  describe("Query Execution & Aggregation", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("successfully counts and groups communities by cellId", async () => {
      const mockQueryResult = [
        { cellId: "cell-1", count: "5" },
        { cellId: "cell-2", count: 12 },
      ];

      const { db, spies } = makeMockDb(mockQueryResult);
      vi.mocked(getDatabase).mockResolvedValue(db as never);

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({ "Content-Type": "application/json" });

      const body = JSON.parse(result.body as string);
      expect(body).toEqual([
        { cellId: "cell-1", communityCount: 5 },
        { cellId: "cell-2", communityCount: 12 },
      ]);

      expect(spies.select).toHaveBeenCalledWith(
        expect.objectContaining({
          cellId: "cellCommunities.cellId",
        })
      );
      expect(spies.from).toHaveBeenCalled();
      expect(spies.groupBy).toHaveBeenCalledWith("cellCommunities.cellId");
    });

    it("returns an empty array when no cell community associations exist", async () => {
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
    });

    it("returns 500 when database connectivity fails", async () => {
      vi.mocked(getDatabase).mockRejectedValue(new Error("Timeout establishing connection"));

      const result = await handler(fakeEvent);

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe("Internal Server Error");
    });
  });
});