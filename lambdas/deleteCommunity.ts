import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { eq, and } from "drizzle-orm";
import * as schema from "../database/drizzle/schema";
import { getRequestBody } from "./helpers/request";
import { getOwnerEmail, getUser, verifyOrigin } from "./helpers/auth";
import { sendEmail } from "./helpers/ses";
import { getDatabase, TransactionContext } from "./helpers/db";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "";

async function notifyCommunityDeletion(
  userEmail: string,
  communityName: string,
): Promise<void> {
  await sendEmail({
    to: userEmail,
    subject: "Community Removal Confirmation",
    templateName: "communityDeleted",
    variables: {
      communityName,
      frontendUrl: FRONTEND_URL,
    },
  });
}

async function performDeleteWorkflow(
  tx: TransactionContext,
  targetId: string,
  scope: "approval" | "production",
  hasApproval: boolean,
  hasProduction: boolean,
): Promise<void> {
  if (scope === "production" && hasProduction) {
    await tx
      .delete(schema.communities)
      .where(eq(schema.communities.id, targetId));

    if (hasApproval) {
      await tx
        .delete(schema.approvals)
        .where(eq(schema.approvals.id, targetId));
    }
  } else if ((scope === "approval" || !hasProduction) && hasApproval) {
    await tx.delete(schema.approvals).where(eq(schema.approvals.id, targetId));
  }
}

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (!verifyOrigin(event)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden" }),
      };
    }
    
  try {
    const db = await getDatabase();

    const userEmail = await getOwnerEmail(event);
    const owner = await getUser(event);
    if (userEmail == null || owner == null) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: "Unauthorized: Invalid or missing token claims",
        }),
      };
    }

    const bodyData = getRequestBody(event);
    const targetId = bodyData?.id;
    const scope = bodyData?.scope;

    if (targetId == null || targetId === "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required community 'id'." }),
      };
    }

    if (scope !== "approval" && scope !== "production") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Missing or invalid deletion 'scope' parameter. Expected 'approval' or 'production'.",
        }),
      };
    }

    const [existingApproval] = await db
      .select()
      .from(schema.approvals)
      .where(
        and(
          eq(schema.approvals.id, targetId),
          eq(schema.approvals.owner, owner),
        ),
      );

    const [existingCommunity] = await db
      .select()
      .from(schema.communities)
      .where(
        and(
          eq(schema.communities.id, targetId),
          eq(schema.communities.owner, owner),
        ),
      );

    const hasApproval = existingApproval !== undefined;
    const hasProduction = existingCommunity !== undefined;

    if (!hasApproval && !hasProduction) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error:
            "Target community record not found, or you do not have permission to delete it",
        }),
      };
    }

    const communityName =
      scope === "production" && hasProduction
        ? existingCommunity.name
        : (existingApproval?.name ?? existingCommunity?.name);

    await db.transaction(async (tx) => {
      await performDeleteWorkflow(
        tx,
        targetId,
        scope,
        hasApproval,
        hasProduction,
      );
    });

    await notifyCommunityDeletion(userEmail, communityName as string);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Community (${scope}) successfully deleted.`,
      }),
    };
  } catch (e) {
    console.error("Database Delete Error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
