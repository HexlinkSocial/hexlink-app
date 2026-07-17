import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

describe("userCommunitiesApiHelpers", () => {
  const mockBaseUrl = "https://api.example.com";
  const fetchMock = vi.fn();
  let storageMock: Record<string, string> = {};

  beforeEach(() => {
    vi.stubEnv("VITE_BACKEND_URL", mockBaseUrl);
    vi.stubGlobal("fetch", fetchMock);
    
    storageMock = {};
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => storageMock[key] ?? null,
      setItem: (key: string, value: string) => { storageMock[key] = value; },
      removeItem: (key: string) => { delete storageMock[key]; },
      clear: () => { storageMock = {}; }
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    fetchMock.mockClear();
  });

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

  it("should submit community without captcha successfully", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const payload: CommunityPayload = { name: "Green Space", cellIds: ["cell-1"] };
    await postCommunity(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      `${mockBaseUrl}/CreateCommunity`,
      expect.not.objectContaining({
        headers: expect.objectContaining({ "x-captcha-token": expect.any(String) }),
      })
    );
  });

  it("should inject x-captcha-token header when captcha is provided", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const payload: CommunityPayload = { name: "Eco Hub", cellIds: ["cell-1"] };
    const captchaToken = "sample-turnstile-token-xyz";

    await postCommunity(payload, captchaToken);

    expect(fetchMock).toHaveBeenCalledWith(
      `${mockBaseUrl}/CreateCommunity`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-captcha-token": "sample-turnstile-token-xyz",
        }),
      })
    );
  });

  it("should throw a database insertion error on non-ok responses", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    const payload: CommunityPayload = { name: "Broken Node", cellIds: ["cell-1"] };
    await expect(postCommunity(payload)).rejects.toThrow("Database insertion failure");
  });

  it("should persist pending community details and token", () => {
    const pendingData: CommunityPayload = { name: "Future Place", cellIds: ["cell-1"] };
    savePending(pendingData, "pending-token-123");

    const saved = loadPending();
    const savedToken = loadPendingToken();
    expect(saved).toEqual(pendingData);
    expect(savedToken).toBe("pending-token-123");
  });

  it("should clear items safely on invoking clearPending", () => {
    const pendingData: CommunityPayload = { name: "Temporary", cellIds: ["cell-1"] };
    savePending(pendingData, "tok");
    clearPending();
    expect(loadPending()).toBeNull();
    expect(loadPendingToken()).toBeNull();
  });

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

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPayload,
    } as Response);

    const list = await fetchUserCommunities();

    expect(list).toHaveLength(3);
    expect(list[0].status).toBe("amendments_requested");
    expect(list[1].status).toBe("pending");
    expect(list[2].status).toBe("approved");
  });

  it("should throw error when api load fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("API Down"));
    await expect(fetchUserCommunities()).rejects.toThrow("API Down");
  });

  it("should submit normalized modifications to the API", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ updated: true }),
    } as Response);

    const updates = { id: "community-123", name: "Renamed Hub", whatsapp: "whatsapp.com/test" };
    await editCommunity(updates);

    expect(fetchMock).toHaveBeenCalledWith(
      `${mockBaseUrl}/EditCommunity`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          id: "community-123",
          name: "Renamed Hub",
          whatsapp: "http://whatsapp.com/test",
        }),
      })
    );
  });

  it("should fire request to delete route with scopes", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Deleted" }),
    } as Response);

    await deleteCommunity("community-123", "production");

    expect(fetchMock).toHaveBeenCalledWith(
      `${mockBaseUrl}/DeleteCommunity`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: "community-123", scope: "production" }),
      })
    );
  });
});