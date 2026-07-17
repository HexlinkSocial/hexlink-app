import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildPayload,
  postCommunity,
  savePending,
  loadPending,
  loadPendingToken,
  clearPending,
  fetchUserCommunities,
  editCommunity,
  deleteCommunity,
  CommunityPayload,
  UserCommunitiesPayload,
} from "./userCommunitiesApiHelpers";

vi.mock("./authHeaders", () => ({
  adminHeaders: vi.fn().mockResolvedValue({
    "Content-Type": "application/json",
    Authorization: "Bearer mock-admin-token",
  }),
}));

describe("userCommunitiesApiHelpers", () => {
  let globalFetchSpy: any;
  let store: Record<string, string> = {};

  beforeEach(() => {
    globalFetchSpy = vi.fn();
    global.fetch = globalFetchSpy;
    vi.stubEnv("VITE_BACKEND_URL", "https://api.test");

    store = {};
    const mockSessionStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      length: 0,
      key: (index: number) => Object.keys(store)[index] || null,
    };
    vi.stubGlobal("sessionStorage", mockSessionStorage);
  });

  describe("buildPayload", () => {
    it("should correctly format and normalize community payloads", () => {
      const data = {
        name: "Test Name",
        description: "Test Desc",
        whatsapp: "chat.whatsapp.com/123",
        discord: "https://discord.gg/abc",
        facebook: "facebook.com/page",
        other: "  ",
      };
      const ids = new Set(["cell-1", "cell-2"]);

      const payload = buildPayload(data, ids);

      expect(payload).toEqual({
        name: "Test Name",
        description: "Test Desc",
        whatsapp: "http://chat.whatsapp.com/123",
        discord: "https://discord.gg/abc",
        facebook: "http://facebook.com/page",
        other: "",
        cellIds: ["cell-1", "cell-2"],
      });
    });
  });

  describe("postCommunity", () => {
    const payload: CommunityPayload = {
      name: "Community",
      cellIds: ["1"],
    };

    it("should submit community without captcha successfully", async () => {
      globalFetchSpy.mockResolvedValue({ ok: true });

      await postCommunity(payload);

      expect(globalFetchSpy).toHaveBeenCalledWith("https://api.test/CreateCommunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-admin-token",
        },
        body: JSON.stringify(payload),
      });
    });

    it("should inject x-captcha-token header when captcha is provided", async () => {
      globalFetchSpy.mockResolvedValue({ ok: true });

      await postCommunity(payload, "captcha-token-abc");

      expect(globalFetchSpy).toHaveBeenCalledWith("https://api.test/CreateCommunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-admin-token",
          "x-captcha-token": "captcha-token-abc",
        },
        body: JSON.stringify(payload),
      });
    });

    it("should throw a database insertion error on non-ok responses", async () => {
      globalFetchSpy.mockResolvedValue({ ok: false });

      await expect(postCommunity(payload)).rejects.toThrow("Database insertion failure");
    });
  });

  describe("Session Storage Utilities", () => {
    const payload: CommunityPayload = { name: "Saved", cellIds: ["1"] };

    it("should persist pending community details and token", () => {
      savePending(payload, "pending-token");

      expect(loadPending()).toEqual(payload);
      expect(loadPendingToken()).toBe("pending-token");
    });

    it("should clear items safely on invoking clearPending", () => {
      savePending(payload, "pending-token");
      clearPending();

      expect(loadPending()).toBeNull();
      expect(loadPendingToken()).toBeNull();
    });
  });

  describe("fetchUserCommunities", () => {
    it("should parse, normalize, and prioritize user communities lists", async () => {
      const mockPayload: UserCommunitiesPayload = {
        approvals: [
          {
            id: "app-1",
            name: "Amendments Req",
            description: "Some desc",
            status: "amendments_requested",
            comments: "Please fix description",
          },
          {
            id: "app-2",
            name: "Pending Comm",
            description: "Desc here",
            status: "pending",
          },
        ],
        communities: [
          {
            id: "comm-1",
            name: "Approved Comm",
            description: "An approved body",
          },
        ],
      };

      globalFetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockPayload,
      });

      const list = await fetchUserCommunities();

      expect(list).toHaveLength(3);
      expect(list[0].status).toBe("amendments_requested");
      expect(list[1].status).toBe("pending");
      expect(list[2].status).toBe("approved");
    });

    it("should throw error when api load fails", async () => {
      globalFetchSpy.mockResolvedValue({
        ok: false,
        statusText: "Unauthorized",
      });

      await expect(fetchUserCommunities()).rejects.toThrow(
        "Failed to load community details: Unauthorized"
      );
    });
  });

  describe("editCommunity", () => {
    it("should submit normalized modifications to the API", async () => {
      const editPayload = {
        id: "comm-123",
        name: "Modified Name",
        whatsapp: "chat.whatsapp.com/edited",
      };

      const mockResponse = { message: "Changes submitted" };
      globalFetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await editCommunity(editPayload);

      expect(globalFetchSpy).toHaveBeenCalledWith("https://api.test/EditCommunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-admin-token",
        },
        body: JSON.stringify({
          id: "comm-123",
          name: "Modified Name",
          whatsapp: "http://chat.whatsapp.com/edited",
        }),
      });
      expect(response).toEqual(mockResponse);
    });
  });

  describe("deleteCommunity", () => {
    it("should fire request to delete route with scopes", async () => {
      const mockResponse = { message: "Community deleted" };
      globalFetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await deleteCommunity("id-to-delete", "production");

      expect(globalFetchSpy).toHaveBeenCalledWith("https://api.test/DeleteCommunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-admin-token",
        },
        body: JSON.stringify({ id: "id-to-delete", scope: "production" }),
      });
      expect(response).toEqual(mockResponse);
    });
  });
});