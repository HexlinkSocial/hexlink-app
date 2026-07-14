const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";
const IS_DEV = import.meta.env.DEV;

export interface ErrorReportPayload {
  message: string;
  userAgent?: string;
}

class Logger {
  public error(message: string): void {
    if (IS_DEV) {
      console.error(message);
      return;
    }

    let errorInstance: Error | undefined;

    const report: ErrorReportPayload = {
      message: errorInstance ? `${message}: ${errorInstance.message}` : message,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    this.sendReport(report);
  }

  private sendReport(report: ErrorReportPayload): void {
    fetch(`${BACKEND_URL}/LogFrontendError`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(report),
      keepalive: true,
    }).catch((e) => {
      console.warn("Failed to transmit telemetry payload:", e);
    });
  }
}

export const logger = new Logger();