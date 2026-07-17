// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTurnstile } from "./useTurnstile";

describe("useTurnstile", () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    vi.stubEnv("DEV", false);
    delete (window as any).turnstile;
    const script = document.getElementById("cloudflare-turnstile-script");
    if (script) {
      script.remove();
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should automatically resolve with bypass token in development environments", async () => {
    vi.stubEnv("DEV", true);

    const { result } = renderHook(() => useTurnstile({ siteKey: "test-key" }));

    let tokenPromise: Promise<string> | undefined;
    act(() => {
      tokenPromise = result.current.executeChallenge();
    });

    await expect(tokenPromise).resolves.toBe("dev-bypass-token");
  });

  it("should reject challenge execution if the Turnstile client engine is missing", async () => {
    const { result } = renderHook(() => useTurnstile({ siteKey: "test-key" }));

    let tokenPromise: Promise<string> | undefined;
    act(() => {
      tokenPromise = result.current.executeChallenge();
    });

    await expect(tokenPromise).rejects.toThrow(
      "Turnstile engine has not finished loading yet."
    );
  });

  it("should inject script tag into DOM headers dynamically on initialization", () => {
    renderHook(() => useTurnstile({ siteKey: "test-key" }));

    const script = document.getElementById("cloudflare-turnstile-script") as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.src).toContain("challenges.cloudflare.com");
  });
});