import React, { JSX } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailLayout } from "./EmailLayout";

const CommunityEditSubmittedEmail = (): JSX.Element => {
  return (
    <EmailLayout subject="Community Edit Submitted">
      <h1 className="email-title">Community Edit Submitted</h1>

      <p className="email-text">
        Your changes to <strong>{"{{communityName}}"}</strong> have been
        successfully submitted and are currently being reviewed.
      </p>

      <p className="email-text">
        If your edit was on a live community, it will remain as-is and your
        changes will be processed separately. If you submitted changes to an
        entry that is already in review, the pending item will be updated
        directly.
      </p>

      <p className="email-text text-sm">
        You can view the status of your submission and edit it at any time
        directly via your management dashboard:
      </p>

      <div className="email-button-container">
        <a href="{{frontendUrl}}/manage" className="email-button">
          View Submission Status
        </a>
      </div>
    </EmailLayout>
  );
};

const emailElement: React.ReactElement = <CommunityEditSubmittedEmail />;

export const html = renderToStaticMarkup(emailElement);
