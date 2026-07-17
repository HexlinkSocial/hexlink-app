import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminHeaders } from "./authHeaders";
import { fetchAuthSession } from "aws-amplify/auth";

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(),
}));

describe("adminHeaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return headers with Authorization token when token is present", async () => {
    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: {
        idToken: {
          toString: () => "mocked-jwt-token",
        },
      },
    } as any);

    const headers = await adminHeaders();

    expect(headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer mocked-jwt-token",
    });
  });

  it("should return basic JSON content type without Authorization header when tokens are missing", async () => {
    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: undefined,
    } as any);

    const headers = await adminHeaders();

    expect(headers).toEqual({
      "Content-Type": "application/json",
    });
  });
});
