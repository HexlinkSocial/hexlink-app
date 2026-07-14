export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error(
      "TURNSTILE_SECRET_KEY environment variable is not configured.",
    );
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }).toString(),
      },
    );

    const data = (await response.json()) as { success: boolean };
    return !!data?.success;
  } catch (error) {
    console.error("Turnstile API verification request failed:", error);
    return false;
  }
}

export function extractCaptchaToken(
  source: Record<string, string | undefined> | undefined,
): string | undefined {
  if (!source) return undefined;
  return source["x-captcha-token"] || source["X-Captcha-Token"];
}

export async function verifyRequestCaptcha(
  source: Record<string, string | undefined> | undefined,
): Promise<{ success: boolean; errorType?: "missing" | "failed" }> {
  const isDev = process.env.NODE_ENV === "development";
  const token = extractCaptchaToken(source);

  if (!token) {
    return isDev
      ? { success: true }
      : { success: false, errorType: "missing" };
  }

  const success = await verifyTurnstileToken(token);
  return {
    success,
    errorType: success ? undefined : "failed",
  };
}