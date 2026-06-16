import React, { JSX } from "react";
import { useRouteError } from "react-router-dom";
import "../styles/ErrorPage.css";

export default function ErrorPage(): JSX.Element {
  const error = useRouteError();

  console.error("Runtime App Error caught by boundary:", error);

  const handleReload = (): void => {
    window.location.assign("/");
  };

  return (
    <div className="error-page-container">
      <div className="error-flex-overlay">
        <div className="error-card">
          <div className="error-icon">
            <img src="/warning-hex.png" alt="Warning Icon" />
          </div>
          <h1 className="error-heading">An unexpected error occurred</h1>
          <p className="error-text">
            Something went wrong behind the scenes. We&apos;ve been notified and
            are looking into it.
          </p>

          {process.env.NODE_ENV === "development" && (
            <pre className="error-details">
              {error instanceof Error ? error.message : String(error)}
            </pre>
          )}

          <button onClick={handleReload} className="button">
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
}
