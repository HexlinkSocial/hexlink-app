import React, { JSX } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailLayout } from "./EmailLayout";

const CommunityDeletedEmail = (): JSX.Element => {
  return (
    <EmailLayout subject="Community Removal Confirmation">
      <h1 className="email-title">Community Deleted</h1>

      <p className="email-text">
        This email confirms that your community or edit for{" "}
        <strong>{"{{communityName}}"}</strong> has been successfully deleted
        from your profile.
      </p>

      <p className="email-text">
        Please note that changes are reflected through sync pipelines and it
        will completely disappear from the global map view within 24 hours.
      </p>

      <p className="email-text text-sm">
        If you have any questions or did not authorize this action, please reach
        out to support immediately.
      </p>
    </EmailLayout>
  );
};

const emailElement: React.ReactElement = <CommunityDeletedEmail />;

export const html = renderToStaticMarkup(emailElement);
