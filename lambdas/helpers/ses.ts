import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import * as communitySubmissionConfirmationTemplate from "../dist/email_templates/communitySubmissionConfirmation";
import * as communityApprovedTemplate from "../dist/email_templates/communityApproved";
import * as communityAmendmentsTemplate from "../dist/email_templates/communityAmendments";
import * as communityDeniedTemplate from "../dist/email_templates/communityDenied";
import * as communityEditSubmittedTemplate from "../dist/email_templates/communityEditSubmitted";
import * as communityDeletedTemplate from "../dist/email_templates/communityDeleted";

const ses = new SESClient({ region: process.env.AWS_REGION ?? "eu-west-1" });

const FROM_ADDRESS = process.env.SES_FROM_ADDRESS!;

const templates: Record<string, string> = {
  communitySubmissionConfirmation: communitySubmissionConfirmationTemplate.html,
  communityApproved: communityApprovedTemplate.html,
  communityAmendments: communityAmendmentsTemplate.html,
  communityDenied: communityDeniedTemplate.html,
  communityEditSubmitted: communityEditSubmittedTemplate.html,
  communityDeleted: communityDeletedTemplate.html,
};

function renderTemplate(
  html: string,
  variables: Record<string, string>,
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    html,
  );
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  templateName: string;
  variables: Record<string, string>;
}): Promise<void> {
  const rawHtml = templates[params.templateName];

  if (!rawHtml) {
    throw new Error(`Unknown email template: ${params.templateName}`);
  }

  const html = renderTemplate(rawHtml, params.variables);

  await ses.send(
    new SendEmailCommand({
      Source: `Hexlink <${FROM_ADDRESS}>`,
      Destination: {
        ToAddresses: [params.to],
      },
      Message: {
        Subject: {
          Data: params.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: html,
            Charset: "UTF-8",
          },
        },
      },
    }),
  );
}
