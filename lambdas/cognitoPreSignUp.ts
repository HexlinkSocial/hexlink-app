import { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from "aws-lambda";
import { verifyTurnstileToken } from "./helpers/turnstile";

export const handler: PreSignUpTriggerHandler = async (
  event: PreSignUpTriggerEvent,
): Promise<PreSignUpTriggerEvent> => {
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return event;
  }

  const captchaToken = event.request.validationData?.["captchaToken"];

  if (!captchaToken) {
    throw new Error("Security validation token is missing.");
  }

  const isHuman = await verifyTurnstileToken(captchaToken);
  if (!isHuman) {
    throw new Error(
      "Security validation failed. Automated bot activity detected.",
    );
  }

  return event;
};
