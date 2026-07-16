import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { sendEmail } from "../../helpers/ses";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("@aws-sdk/client-ses", () => {
  return {
    SESClient: class {
      send = mockSend;
    },
    SendEmailCommand: class {
      constructor(public input: any) {}
    },
  };
});

vi.mock("../../dist/email_templates/communitySubmissionConfirmation", () => ({
  html: "<h1>Welcome {{name}}!</h1><p>Your submission is being reviewed.</p>",
}));
vi.mock("../../dist/email_templates/communityApproved", () => ({
  html: "<h1>Approved!</h1><p>Community {{communityName}} is live.</p>",
}));
vi.mock("../../dist/email_templates/communityAmendments", () => ({
  html: "<h1>Amendments Required</h1>",
}));
vi.mock("../../dist/email_templates/communityDenied", () => ({
  html: "<h1>Denied</h1>",
}));
vi.mock("../../dist/email_templates/communityEditSubmitted", () => ({
  html: "<h1>Edit Submitted</h1>",
}));
vi.mock("../../dist/email_templates/communityDeleted", () => ({
  html: "<h1>Deleted</h1>",
}));

describe("email helper", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    process.env.AWS_REGION = "eu-west-1";
    process.env.SES_FROM_ADDRESS = "no-reply@hexlink.xyz";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe("Feature Flag Bypass Check", () => {
    it("returns immediately and does not send an email if SEND_EMAILS env variable is not set to 'true'", async () => {
      process.env.SEND_EMAILS = "false";

      await sendEmail({
        to: "user@example.com",
        subject: "Submission Confirmation",
        templateName: "communitySubmissionConfirmation",
        variables: { name: "Alice" },
      });

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Template Validation", () => {
    beforeEach(() => {
      process.env.SEND_EMAILS = "true";
    });

    it("throws an explicit error when attempting to render an unknown template", async () => {
      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Welcome",
          templateName: "nonExistentTemplate",
          variables: {},
        })
      ).rejects.toThrow("Unknown email template: nonExistentTemplate");

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Template Substitution & SDK Dispatch", () => {
    beforeEach(() => {
      process.env.SEND_EMAILS = "true";
    });

    it("correctly renders template variables and dispatches the email using the SES SDK", async () => {
      mockSend.mockResolvedValue({ MessageId: "msg-12345" });

      await sendEmail({
        to: "user@example.com",
        subject: "Community Approved",
        templateName: "communityApproved",
        variables: { communityName: "Developer Hub" },
      });

      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).toEqual({
        Source: "Hexlink <no-reply@hexlink.xyz>",
        Destination: {
          ToAddresses: ["user@example.com"],
        },
        Message: {
          Subject: {
            Data: "Community Approved",
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: "<h1>Approved!</h1><p>Community Developer Hub is live.</p>",
              Charset: "UTF-8",
            },
          },
        },
      });
    });
  });
});