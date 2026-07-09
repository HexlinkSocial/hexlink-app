import { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      execute: (widgetId: string, options?: any) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface UseTurnstileOptions {
  siteKey: string;
}

export const useTurnstile = ({ siteKey }: UseTurnstileOptions) => {
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const callbacksRef = useRef<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  } | null>(null);

  useEffect(() => {
    if (window.turnstile) {
      setIsReady(true);
      return;
    }

    const scriptId = "cloudflare-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleScriptLoad = () => setIsReady(true);
    script.addEventListener("load", handleScriptLoad);

    return () => {
      script.removeEventListener("load", handleScriptLoad);
    };
  }, []);

  const cleanupWidget = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }
    setIsOpen(false);
  };

  const handleCallback = (token: string) => {
    if (callbacksRef.current) {
      callbacksRef.current.resolve(token);
      callbacksRef.current = null;
    }
    cleanupWidget();
  };

  const handleError = (err: any) => {
    if (callbacksRef.current) {
      callbacksRef.current.reject(
        new Error(err || "Managed challenge window validation failed."),
      );
      callbacksRef.current = null;
    }
    cleanupWidget();
  };

  const handleExpired = () => {
    if (callbacksRef.current) {
      callbacksRef.current.reject(
        new Error("Security session expired. Please re-verify."),
      );
      callbacksRef.current = null;
    }
    cleanupWidget();
  };

  const renderChallengeWidget = (
    targetContainer: HTMLDivElement,
    resolve: (token: string) => void,
    reject: (error: Error) => void,
  ) => {
    try {
      widgetIdRef.current = window.turnstile!.render(targetContainer, {
        sitekey: siteKey,
        execution: "execute",
        callback: handleCallback,
        "error-callback": handleError,
        "expired-callback": handleExpired,
      });

      window.turnstile!.execute(widgetIdRef.current);
    } catch (error) {
      cleanupWidget();
      callbacksRef.current = null;
      reject(
        error instanceof Error
          ? error
          : new Error("Failed to initialize managed challenge sequence."),
      );
    }
  };

  useEffect(() => {
    if (isOpen && containerRef.current && callbacksRef.current) {
      renderChallengeWidget(
        containerRef.current,
        callbacksRef.current.resolve,
        callbacksRef.current.reject,
      );
    }
  }, [isOpen]);

  const executeChallenge = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.turnstile || !isReady) {
        reject(new Error("Turnstile engine has not finished loading yet."));
        return;
      }

      cleanupWidget();
      callbacksRef.current = { resolve, reject };
      setIsOpen(true);
    });
  };

  useEffect(() => {
    return () => {
      cleanupWidget();
    };
  }, []);

  return { executeChallenge, isOpen, containerRef };
};
