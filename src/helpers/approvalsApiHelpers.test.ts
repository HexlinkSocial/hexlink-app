import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchApprovals, submitAction, ApprovalItem } from "./approvalsApiHelpers";

vi.mock("./authHeaders", () => ({
  adminHeaders: vi.fn().mockResolvedValue({
    "Content-Type": "application/json",
    Authorization: "Bearer mock-admin-token",
  }),
  authHeaders: vi.fn().mockResolvedValue({
    "Content-Type": "application/json",
    Authorization: "Bearer mock-admin-token",
  }),
  userHeaders: vi.fn().mockResolvedValue({
    "Content-Type": "application/json",
    Authorization: "Bearer mock-admin-token",
  }),
  default: {
    adminHeaders: vi.fn().mockResolvedValue({
      "Content-Type": "application/json",
      Authorization: "Bearer mock-admin-token",
    }),
    authHeaders: vi.fn().mockResolvedValue({
      "Content-Type": "application/json",
      Authorization: "Bearer mock-admin-token",
    }),
    userHeaders: vi.fn().mockResolvedValue({
      "Content-Type": "application/json",
      Authorization: "Bearer mock-admin-token",
    }),
  },
}));

describe("approvalsApiHelpers", () => {
  const mockBaseUrl = "https://api.example.com";
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("VITE_BACKEND_URL", mockBaseUrl);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    fetchMock.mockClear();
  });

  describe("fetchApprovals", () => {
    it("should retrieve pending communities list successfully", async () => {
      const mockApprovalsList: ApprovalItem[] = [
        {
          id: "pending-123",
          name: "Eco Project",
          description: "A green community initiative",
          owner: "usr_1",
          ownerEmail: "test@example.com",
          cellIds: ["881f1d4885fffff"],
          status: "pending",
          comments: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          lastEdited: "2026-01-01T00:00:00.000Z",
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApprovalsList,
      } as Response);

      const result = await fetchApprovals();

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockBaseUrl}/GetPendingCommunities`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-admin-token",
          },
          body: JSON.stringify({}),
        })
      );
      expect(result).toEqual(mockApprovalsList);
    });

    it("should throw an error with status if fetch response is not ok", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
      } as Response);

      await expect(fetchApprovals()).rejects.toThrow("HTTP 403");
    });
  });

  describe("submitAction", () => {
    it("should send approval choice and comments to action endpoint", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await submitAction("pending-123", "approve", "Approved after review");

      expect(fetchMock).toHaveBeenCalledWith(
        `${mockBaseUrl}/ApproveOrDenyCommunity`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-admin-token",
          },
          body: JSON.stringify({
            id: "pending-123",
            action: "approve",
            comments: "Approved after review",
          }),
        })
      );
    });

    it("should throw an error with status if post response is not ok", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      await expect(
        submitAction("pending-123", "reject", "Missing coordinates")
      ).rejects.toThrow("HTTP 400");
    });
  });
});