import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const Template = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <title>Community Submission Confirmation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          width: "100% !important",
          height: "100% !important",
          margin: "0 !important",
          padding: "0 !important",
          fontFamily:
            "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          backgroundColor: "#f8f7f9",
          color: "#1a1a1a",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
          <div
            style={{
              background: "#ffffff",
              padding: "40px",
              borderRadius: "8px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#73197a",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              Hexlink
            </div>

            <h1
              style={{
                fontSize: "22px",
                fontWeight: 600,
                lineHeight: "30px",
                marginTop: 0,
                marginBottom: "16px",
                color: "#1a1a1a",
                textAlign: "center",
              }}
            >
              Community Submission Confirmation
            </h1>

            <p
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                marginBottom: "16px",
                color: "#6b6b7a",
                textAlign: "center",
              }}
            >
              Thank you for submitting <strong>{"{{communityName}}"}</strong> to
              our community index.
            </p>

            <p
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                marginBottom: "24px",
                color: "#6b6b7a",
                textAlign: "center",
              }}
            >
              It has now been sent for review. You will be notified when it gets
              approved, or if it gets rejected or requires changes.
            </p>

            <p
              style={{
                fontSize: "14px",
                lineHeight: "20px",
                color: "#6b6b7a",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              You can view the status of your submission and edit it at any time
              directly via your management dashboard:
            </p>

            <div style={{ textAlign: "center", margin: "24px" }}>
              <a
                href="{{appUrl}}/manage"
                style={{
                  display: "inline-block",
                  padding: "12px 32px",
                  backgroundColor: "#73197a",
                  color: "#ffffff",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "16px",
                  boxShadow: "0 4px 12px rgba(115, 25, 122, 0.2)",
                }}
              >
                View Submission Status
              </a>
            </div>

            <p
              style={{
                fontSize: "12px",
                lineHeight: "18px",
                color: "#a1a1b2",
                marginBottom: 0,
                textAlign: "center",
                borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                paddingTop: "24px",
              }}
            >
              This is an automated system notification. Please do not reply
              directly to this message.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

export const html = `<!DOCTYPE html>${renderToStaticMarkup(<Template />)}`;
