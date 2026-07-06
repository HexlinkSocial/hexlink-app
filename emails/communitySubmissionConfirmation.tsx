import React, { JSX } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailLayout } from "./EmailLayout";

const CommunitySubmissionEmail = (): JSX.Element => {
  return (
    <EmailLayout subject="Community Submission Confirmation">
      <h1 className="email-title">Community Submission Confirmation</h1>

      <p className="email-text">
        Thank you for submitting <strong>{"{{communityName}}"}</strong> to our
        community index.
      </p>

      <p className="email-text">
        It has now been sent for review. You will be notified when it gets
        approved, or if it gets rejected or requires changes.
      </p>

      <p className="email-text text-sm">
        You can view the status of your submission and edit it at any time
        directly via your management dashboard:
      </p>

      <div className="email-button-container">
        <a href="{{appUrl}}/manage" className="email-button">
          View Submission Status
        </a>
      </div>
    </EmailLayout>
  );
};

export const html = renderToStaticMarkup(<CommunitySubmissionEmail />);
