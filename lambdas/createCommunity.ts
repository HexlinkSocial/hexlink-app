import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import * as schema from "../database/drizzle/schema";
import { getRequestBody } from "./helpers/request";
import { sendEmail } from "./helpers/ses";
import { getDatabase } from "./helpers/db";

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const bodyData = getRequestBody(event);
    const { name, description, owner, ownerEmail, communityLink, cellIds } =
      bodyData;

    if (
      name == null ||
      owner == null ||
      !Array.isArray(cellIds) ||
      cellIds.length === 0
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Missing fields. 'name', 'owner', and a non-empty array of 'cellIds' are required.",
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

    if (ownerEmail != null) {
      await sendEmail({
        to: ownerEmail,
        subject: "Community Submission Confirmation",
        templateName: "communitySubmissionConfirmation",
        variables: {
          communityName: name,
          frontendUrl: process.env.FRONTEND_URL ?? "",
        },
      });
    }

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
