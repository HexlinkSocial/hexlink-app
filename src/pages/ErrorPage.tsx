import React, { JSX } from "react";
import { useRouteError } from "react-router-dom";

export default function ErrorPage(): JSX.Element {
  const error = useRouteError();
  console.error("Runtime App Error caught by boundary:", error);

  const handleReload = (): void => {
    window.location.assign("/");
  };

  return (
    <div className="error-page">
      <div className="error-page__overlay">
        <div className="error-page__card">
          <div className="error-page__icon">
            <img src="/warning-hex.png" alt="Warning Icon" />
          </div>
          <h1 className="error-page__heading">An unexpected error occurred</h1>
          <p className="error-page__text">
            Something went wrong behind the scenes. We&apos;ve been notified and
            are looking into it.
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre className="error-page__details">
              {error instanceof Error ? error.message : String(error)}
            </pre>
          )}
          <button onClick={handleReload} className="btn btn--primary">
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
