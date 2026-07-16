import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { APIGatewayProxyEventV2 } from "aws-lambda";

vi.mock("../helpers/auth", () => ({
  verifyOrigin: vi.fn(),
}));

import { verifyOrigin } from "../helpers/auth";

const fakeEvent = {} as APIGatewayProxyEventV2;

async function loadHandler() {
  const mod = await import("../logFrontendError");
  return mod.handler;
}

describe("log frontend error handler", () => {
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
    });
  });

  describe("Payload Validation", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("returns 400 when event body is completely missing", async () => {
      const event = {
        body: undefined,
      } as unknown as APIGatewayProxyEventV2;

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Missing log payload body.",
      });
    });

    it("returns 400 when payload is missing the message property", async () => {
      const event = {
        body: JSON.stringify({
          stack: "Error at line 12",
          url: "https://example.com",
        }),
      } as unknown as APIGatewayProxyEventV2;

      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Property 'message' is required.",
      });
    });
  });

  describe("Logging & Processing Workflow", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("successfully parses the payload, logs structured error, and returns 200", async () => {
      const payload = {
        message: "Uncaught ReferenceError: x is not defined",
        userAgent: "Mozilla/5.0",
        url: "https://example.com/home",
      };

      const event = {
        body: JSON.stringify(payload),
      } as unknown as APIGatewayProxyEventV2;

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body as string)).toEqual({
        status: "success",
      });

      expect(console.error).toHaveBeenCalled();
      const consoleCall = vi.mocked(console.error).mock.calls[0][0];
      const parsedLog = JSON.parse(consoleCall);

      expect(parsedLog).toEqual(
        expect.objectContaining({
          level: "ERROR",
          source: "frontend",
          message: "Uncaught ReferenceError: x is not defined",
          userAgent: "Mozilla/5.0",
        })
      );
      expect(parsedLog.timestamp).toBeDefined();
    });

    it("defaults userAgent to 'N/A' when it is not provided in payload", async () => {
      const payload = {
        message: "Database failed to respond",
      };

      const event = {
        body: JSON.stringify(payload),
      } as unknown as APIGatewayProxyEventV2;

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      
      const consoleCall = vi.mocked(console.error).mock.calls[0][0];
      const parsedLog = JSON.parse(consoleCall);
      expect(parsedLog.userAgent).toBe("N/A");
    });
  });

  describe("System Error Handling", () => {
    beforeEach(() => {
      vi.mocked(verifyOrigin).mockReturnValue(true);
    });

    it("returns 500 when payload JSON is malformed", async () => {
      const event = {
        body: "this-is-not-valid-json",
      } as unknown as APIGatewayProxyEventV2;

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body as string)).toEqual({
        error: "Internal Server Error",
      });
      expect(console.error).toHaveBeenCalledWith(
        "Failed to process frontend log:",
        expect.any(SyntaxError)
      );
    });
  });
});