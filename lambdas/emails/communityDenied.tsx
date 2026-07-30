import React, { JSX } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailLayout } from "./EmailLayout";

const CommunityDeniedEmail = (): JSX.Element => {
  return (
    <EmailLayout subject="Submission Update">
      <h1 className="email-title">Submission Update</h1>

      <p className="email-text">
        Thank you for submitting <strong>{"{{communityName}}"}</strong> to our
        community index.
      </p>

      <p className="email-text">
        We regret to inform you that your submission has been denied at this
        time.
      </p>

      {"{{#if comments}}"}
      <div className="email-comments-box">
        <p className="email-text">
          <strong>Reason for denial:</strong>
        </p>
        <p className="email-text">{"{{comments}}"}</p>
      </div>
      {"{{/if}}"}
    </EmailLayout>
  );
};

const emailElement: React.ReactElement = <CommunityDeniedEmail />;

export const html = renderToStaticMarkup(emailElement);
