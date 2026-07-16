import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
}));

vi.mock("../../database/drizzle/schema", () => ({
  cellCommunities: {
    cellId: "cellCommunities.cellId",
    communityId: "cellCommunities.communityId",
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

const mockFindMany = vi.fn();
const mockDb = {
  query: {
    cellCommunities: {
      findMany: mockFindMany,
    },
  },
};

async function loadHandler() {
  const mod = await import("../getCommunitiesByCellId");
  return mod.handler;
}

describe("communities by cell ID handler", () => {
  let handler: Awaited<ReturnType<typeof loadHandler>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getDatabase).mockResolvedValue(mockDb as any);
    handler = await loadHandler();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Origin Verification", () => {
    it("returns 403 when origin verification fails", async () => {
      vi.mocked(verifyOrigin).mockReturnValue(false);

      const event = {} as APIGatewayProxyEventV2;
      const result = await handler(event);

      expect(result.statusCode).toBe(403);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Forbidden",
      });
      expect(getDatabase).not.toHaveBeenCalled();
    });
  });

  describe("Request Validation", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("returns 400 when cellId is missing from both query parameters formats", async () => {
      const event = {
        queryStringParameters: {},
      } as unknown as APIGatewayProxyEventV2;

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Missing required query parameter: cellId",
      });
    });
  });

  describe("Query Executions & Mapping", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("successfully retrieves and maps communities using queryStringParameters", async () => {
      const event = {
        queryStringParameters: { cellId: "cell-123" },
      } as unknown as APIGatewayProxyEventV2;

      const dbResults = [
        {
          community: {
            id: "comm-1",
            name: "Community One",
            description: "First description",
            whatsapp: "https://wa.me/1",
            discord: null,
            facebook: null,
            other: null,
          },
        },
        {
          community: {
            id: "comm-2",
            name: "Community Two",
            description: null,
            whatsapp: null,
            discord: "https://discord.gg/2",
            facebook: null,
            other: null,
          },
        },
      ];
      mockFindMany.mockResolvedValue(dbResults);

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body).toHaveLength(2);
      expect(body[0].id).toBe("comm-1");
      expect(body[1].discord).toBe("https://discord.gg/2");
    });

    it("successfully retrieves and maps communities using fallback query property", async () => {
      const event = {
        query: { cellId: "cell-123" },
      } as unknown as any;

      mockFindMany.mockResolvedValue([
        {
          community: {
            id: "comm-1",
            name: "Community One",
          },
        },
      ]);

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body).toHaveLength(1);
      expect(body[0].name).toBe("Community One");
    });

    it("filters out null or undefined community records dynamically", async () => {
      const event = {
        queryStringParameters: { cellId: "cell-123" },
      } as unknown as APIGatewayProxyEventV2;

      const dbResults = [
        { community: { id: "comm-1", name: "Valid Community" } },
        { community: null },
        { community: undefined },
      ];
      mockFindMany.mockResolvedValue(dbResults);

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe("comm-1");
    });
  });

  describe("System Error Handling", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("returns 500 and logs error when database query fails", async () => {
      const event = {
        queryStringParameters: { cellId: "cell-123" },
      } as unknown as APIGatewayProxyEventV2;

      mockFindMany.mockRejectedValue(new Error("Database connection timeout"));

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      expect(result.body).toBe("Internal Server Error");
      expect(console.error).toHaveBeenCalled();
    });
  });
});