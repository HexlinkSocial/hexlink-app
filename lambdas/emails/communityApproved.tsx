import React, { JSX } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailLayout } from "./EmailLayout";

const CommunityApprovedEmail = (): JSX.Element => {
  return (
    <EmailLayout subject="Community Approved">
      <h1 className="email-title">Community Approved!</h1>

      <p className="email-text">
        Great news! Your submission for <strong>{"{{communityName}}"}</strong>{" "}
        has been successfully approved. It will appear on the map within 24
        hours.
      </p>

      <p className="email-text">
        You can view, manage, and edit your community details at any time
        directly via your dashboard:
      </p>

      <div className="email-button-container">
        <a href="{{frontendUrl}}/manage" className="email-button">
          View and Edit Community
        </a>
      </div>
    </EmailLayout>
  );
};

const emailElement: React.ReactElement = <CommunityApprovedEmail />;

export const html = renderToStaticMarkup(emailElement);
