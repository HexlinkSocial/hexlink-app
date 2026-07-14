import { PreSignUpTriggerHandler } from "aws-lambda";
import { verifyRequestCaptcha } from "./helpers/turnstile";

export const handler: PreSignUpTriggerHandler = async (event) => {
  const verification = await verifyRequestCaptcha(event.request.validationData);

  if (!verification.success) {
    if (verification.errorType === "missing") {
      throw new Error("Security validation token is missing.");
    }
    throw new Error("Security validation failed. Automated bot activity detected.");
  }

  return event;
};