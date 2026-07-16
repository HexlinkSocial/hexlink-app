import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PreSignUpTriggerEvent } from "aws-lambda";

vi.mock("../helpers/turnstile", () => ({
  verifyTurnstileToken: vi.fn(),
}));

import { verifyTurnstileToken } from "../helpers/turnstile";

const createFakeEvent = (validationData?: Record<string, string>): PreSignUpTriggerEvent => {
  return {
    version: "1",
    region: "us-east-1",
    userPoolId: "us-east-1_xxxxxxxxx",
    userName: "test-user",
    callerContext: {
      awsSdkVersion: "1.0.0",
      clientId: "client-id-123",
    },
    triggerSource: "PreSignUp_SignUp",
    request: {
      userAttributes: {
        email: "test@example.com",
      },
      validationData,
    },
    response: {
      autoConfirmUser: false,
      autoVerifyEmail: false,
      autoVerifyPhone: false,
    },
  } as unknown as PreSignUpTriggerEvent;
};

async function loadHandler() {
  const mod = await import("../cognitoPreSignUp");
  return mod.handler;
}

describe("pre sign-up trigger handler", () => {
  const ORIGINAL_ENV = { ...process.env };
  let handler: Awaited<ReturnType<typeof loadHandler>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    handler = await loadHandler();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  describe("Development Environment Bypass", () => {
    it("bypasses all validation checks completely when NODE_ENV is set to development", async () => {
      process.env.NODE_ENV = "development";
      const event = createFakeEvent();

      const result = await handler(event, {} as any, () => {});

      expect(result).toBe(event);
      expect(verifyTurnstileToken).not.toHaveBeenCalled();
    });
  });

  describe("Token Validation Workflow", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("throws an explicit error when validationData is missing entirely", async () => {
      const event = createFakeEvent(undefined);

      await expect(handler(event, {} as any, () => {})).rejects.toThrow(
        "Security validation token is missing."
      );
      expect(verifyTurnstileToken).not.toHaveBeenCalled();
    });

    it("throws an explicit error when captchaToken is missing from validationData", async () => {
      const event = createFakeEvent({ otherField: "some-value" });

      await expect(handler(event, {} as any, () => {})).rejects.toThrow(
        "Security validation token is missing."
      );
      expect(verifyTurnstileToken).not.toHaveBeenCalled();
    });

    it("throws a security error if the Turnstile API rejects the captcha token", async () => {
      const event = createFakeEvent({ captchaToken: "invalid-token" });
      vi.mocked(verifyTurnstileToken).mockResolvedValue(false);

      await expect(handler(event, {} as any, () => {})).rejects.toThrow(
        "Security validation failed. Automated bot activity detected."
      );
      expect(verifyTurnstileToken).toHaveBeenCalledWith("invalid-token");
    });

    it("returns the original event payload unmodified when the captcha token is verified", async () => {
      const event = createFakeEvent({ captchaToken: "valid-token" });
      vi.mocked(verifyTurnstileToken).mockResolvedValue(true);

      const result = await handler(event, {} as any, () => {});

      expect(result).toBe(event);
      expect(verifyTurnstileToken).toHaveBeenCalledWith("valid-token");
    });
  });
});