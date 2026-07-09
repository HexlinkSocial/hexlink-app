import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import * as schema from "../database/drizzle/schema";
import { getRequestBody } from "./helpers/request";
import { sendEmail } from "./helpers/ses";
import { getDatabase } from "./helpers/db";
import { getUser, getOwnerEmail } from "./helpers/auth";

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error(
      "TURNSTILE_SECRET_KEY environment variable is not configured.",
    );
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }).toString(),
      },
    );

    const data = (await response.json()) as { success: boolean };
    return !!data?.success;
  } catch (error) {
    console.error("Turnstile API verification request failed:", error);
    return false;
  }
}

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const captchaToken =
      event.headers["x-captcha-token"] || event.headers["X-Captcha-Token"];

    if (!captchaToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Security validation token is missing from headers.",
        }),
      };
    }

    const isHuman = await verifyTurnstileToken(captchaToken);
    if (!isHuman) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Security validation failed. Automated bot activity detected.",
        }),
      };
    }

    const owner = await getUser(event);
    const ownerEmail = await getOwnerEmail(event);

    if (!owner || !ownerEmail) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: "Unauthorized. Missing or invalid session token.",
        }),
      };
    }

    const bodyData = getRequestBody(event);
    const { name, description, communityLink, cellIds } = bodyData;

    if (name == null || !Array.isArray(cellIds) || cellIds.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Missing fields. 'name' and a non-empty array of 'cellIds' are required.",
        }),
      };
    }

    if (cellIds.length > 50) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "A maximum of 50 cell IDs is allowed.",
        }),
      };
    }

    if (name.length > 100) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Community name cannot exceed 100 characters.",
        }),
      };
    }

    if (
      description !== undefined &&
      description !== null &&
      description.length > 3000
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Description cannot exceed 3000 characters.",
        }),
      };
    }

    const db = await getDatabase();

    const [newApproval] = await db
      .insert(schema.approvals)
      .values({
        name,
        description: description !== undefined ? description : null,
        owner,
        ownerEmail,
        communityLink: communityLink !== undefined ? communityLink : null,
        cellIds: cellIds,
        status: "pending",
      })
      .returning();

    await sendEmail({
      to: ownerEmail,
      subject: "Community Submission Confirmation",
      templateName: "communitySubmissionConfirmation",
      variables: {
        communityName: name,
        frontendUrl: process.env.FRONTEND_URL ?? "",
      },
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Community submission routed to approvals workflow",
        approval: newApproval,
      }),
    };
  } catch (e) {
    console.error("Database Write Error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
