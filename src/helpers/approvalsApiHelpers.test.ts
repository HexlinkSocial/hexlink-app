import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchApprovals, submitAction, ApprovalItem } from "./approvalsApiHelpers";

vi.mock("./authHeaders", () => ({
  adminHeaders: vi.fn().mockResolvedValue({
    "Content-Type": "application/json",
    Authorization: "Bearer mock-admin-token",
  }),
}));

describe("approvalsApiHelpers", () => {
  let globalFetchSpy: any;

  beforeEach(() => {
    globalFetchSpy = vi.fn();
    global.fetch = globalFetchSpy;
    vi.stubEnv("VITE_BACKEND_URL", "https://api.test");
  });

  describe("fetchApprovals", () => {
    it("should fetch pending communities successfully", async () => {
      const mockApprovals: ApprovalItem[] = [
        {
          id: "1",
          name: "Test Community",
          description: "A test description",
          owner: "owner-1",
          ownerEmail: "owner@test.com",
          cellIds: ["cell-1"],
          status: "pending",
          comments: null,
          createdAt: "2026-01-01T00:00:00Z",
          lastEdited: "2026-01-01T00:00:00Z",
        },
      ];

      globalFetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockApprovals,
      });

      const result = await fetchApprovals();

      expect(globalFetchSpy).toHaveBeenCalledWith("https://api.test/GetPendingCommunities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-admin-token",
        },
        body: JSON.stringify({}),
      });
      expect(result).toEqual(mockApprovals);
    });

    it("should throw an error when fetch fails", async () => {
      globalFetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(fetchApprovals()).rejects.toThrow("HTTP 500");
    });
  });

  describe("submitAction", () => {
    it("should successfully post approval action with comments", async () => {
      globalFetchSpy.mockResolvedValue({
        ok: true,
      });

      await submitAction("1", "approve", "Looks excellent");

      expect(globalFetchSpy).toHaveBeenCalledWith("https://api.test/ApproveOrDenyCommunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-admin-token",
        },
        body: JSON.stringify({
          id: "1",
          action: "approve",
          comments: "Looks excellent",
        }),
      });
    });

    it("should throw an error when action submission fails", async () => {
      globalFetchSpy.mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(submitAction("1", "reject")).rejects.toThrow("HTTP 400");
    });
  });
});