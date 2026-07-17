import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Logger Class", () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let globalFetchSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    globalFetchSpy = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = globalFetchSpy;

    vi.stubGlobal("navigator", { userAgent: "mock-agent" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("should log to console and not send network report in DEV mode", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_BACKEND_URL", "https://api.test");

    const { logger } = await import("./logger");

    logger.error("Dev Mode Error Test");

    expect(consoleErrorSpy).toHaveBeenCalledWith("Dev Mode Error Test");
    expect(globalFetchSpy).not.toHaveBeenCalled();
  });

  it("should send API report and not log to console in production mode", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_BACKEND_URL", "https://api.test");

    vi.resetModules();
    const { logger } = await import("./logger");

    logger.error("Prod Mode Error Test");

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(globalFetchSpy).toHaveBeenCalledWith("https://api.test/LogFrontendError", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Prod Mode Error Test",
        userAgent: "mock-agent",
      }),
      keepalive: true,
    });
  });

  it("should print warning to console if network request fails", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_BACKEND_URL", "https://api.test");
    globalFetchSpy.mockRejectedValue(new Error("Network connection lost"));

    vi.resetModules();
    const { logger } = await import("./logger");

    logger.error("Failing Connection Error Test");

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to transmit telemetry payload:",
      expect.any(Error)
    );
  });
});