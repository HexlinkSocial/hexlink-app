import React, { JSX } from "react";
import styles from "./_emails.scss?inline";

interface EmailLayoutProps {
  subject: string;
  children: React.ReactNode;
}

export const EmailLayout = ({
  subject,
  children,
}: EmailLayoutProps): JSX.Element => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <title>{subject}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      </head>
      <body className="email-body">
        <div className="email-container">
          <div className="email-card">
            <div className="email-logo">Hexlink</div>
            {children}
            <p className="email-footer">
              This is an automated system notification. Please do not reply
              directly to this message.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
