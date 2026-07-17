// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";

vi.mock("@aws-amplify/ui-react", () => ({
  useAuthenticator: vi.fn(),
}));

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: vi.fn(),
}));

describe("useAuth", () => {
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return logged out state when no user is present", async () => {
    vi.mocked(useAuthenticator).mockReturnValue({
      user: null,
      signOut: mockSignOut,
    } as any);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("should determine admin state correctly from cognito groups array", async () => {
    vi.mocked(useAuthenticator).mockReturnValue({
      user: { username: "adminUser" },
      signOut: mockSignOut,
    } as any);

    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: {
        idToken: {
          payload: {
            "cognito:groups": ["Users", "Admins"],
          },
        },
      },
    } as any);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it("should determine admin state correctly from comma-separated cognito groups string", async () => {
    vi.mocked(useAuthenticator).mockReturnValue({
      user: { username: "adminUser" },
      signOut: mockSignOut,
    } as any);

    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: {
        idToken: {
          payload: {
            "cognito:groups": "Users,Admins",
          },
        },
      },
    } as any);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
  });

  it("should set admin to false and stop loading if session fetch fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(useAuthenticator).mockReturnValue({
      user: { username: "testUser" },
      signOut: mockSignOut,
    } as any);

    vi.mocked(fetchAuthSession).mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});