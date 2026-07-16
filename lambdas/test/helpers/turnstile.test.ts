import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken } from "../../helpers/turnstile";

describe("verifyTurnstileToken helper", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    process.env.TURNSTILE_SECRET_KEY = "mock-secret-key";
    
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Development Environment Bypass", () => {
    it("returns true instantly and bypasses fetch call when NODE_ENV is development", async () => {
      process.env.NODE_ENV = "development";

      const result = await verifyTurnstileToken("any-token");

      expect(result).toBe(true);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Configuration & Environment Diagnostics", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("returns false and logs an error if TURNSTILE_SECRET_KEY is missing", async () => {
      delete process.env.TURNSTILE_SECRET_KEY;

      const result = await verifyTurnstileToken("some-token");

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "TURNSTILE_SECRET_KEY environment variable is not configured."
      );
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe("API Communication & Payload Verification", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("sends a properly formatted URL-encoded POST request and returns true on success", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true }),
      };
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await verifyTurnstileToken("valid-user-token");

      expect(result).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            secret: "mock-secret-key",
            response: "valid-user-token",
          }).toString(),
        }
      );
    });

    it("returns false if the Turnstile API explicitly rejects the token", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: false }),
      };
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await verifyTurnstileToken("invalid-user-token");

      expect(result).toBe(false);
    });
  });

  describe("Fault Tolerance & Exception Handling", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("catches network-level failures, logs the error, and returns false", async () => {
      const networkError = new Error("Network connection dropped");
      vi.mocked(globalThis.fetch).mockRejectedValue(networkError);

      const result = await verifyTurnstileToken("user-token");

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Turnstile API verification request failed:",
        networkError
      );
    });

    it("catches JSON parsing exceptions from an invalid API response, logs the error, and returns false", async () => {
      const mockResponse = {
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON at position 0");
        },
      };
      vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as unknown as Response);

      const result = await verifyTurnstileToken("user-token");

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Turnstile API verification request failed:",
        expect.any(SyntaxError)
      );
    });
  });
});