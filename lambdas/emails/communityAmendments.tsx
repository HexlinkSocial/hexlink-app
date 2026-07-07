import React, { JSX } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailLayout } from "./EmailLayout";

const CommunityAmendmentsEmail = (): JSX.Element => {
  return (
    <EmailLayout subject="Changes Required for Your Submission">
      <h1 className="email-title">Submission Needs Changes</h1>

      <p className="email-text">
        Your submission for <strong>{"{{communityName}}"}</strong> requires some
        updates before it can go live.
      </p>

      <p className="email-text">
        <strong>Reason for changes:</strong>
      </p>
      <blockquote className="email-blockquote">{"{{comments}}"}</blockquote>

      <p className="email-text text-sm">
        You can submit your updated changes by editing your entry directly on
        your management page:
      </p>

      <div className="email-button-container">
        <a href="{{frontendUrl}}/manage" className="email-button">
          Edit Submission
        </a>
      </div>
    </EmailLayout>
  );
};

const emailElement: React.ReactElement = <CommunityAmendmentsEmail />;

export const html = renderToStaticMarkup(emailElement);
