import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { eq } from "drizzle-orm";
import * as schema from "../database/drizzle/schema";
import { getRequestBody } from "./helpers/request";
import { isAdmin, verifyOrigin } from "./helpers/auth";
import { sendEmail } from "./helpers/ses";
import { getDatabase, TransactionContext } from "./helpers/db";

type ApprovalItem = typeof schema.approvals.$inferSelect;

const FRONTEND_URL = process.env.FRONTEND_URL;

async function handleApprove(
  tx: TransactionContext,
  approvalItem: ApprovalItem,
): Promise<void> {
  const [newCommunity] = await tx
    .insert(schema.communities)
    .values({
      id: approvalItem.id,
      name: approvalItem.name,
      description: approvalItem.description,
      owner: approvalItem.owner,
      whatsapp: approvalItem.whatsapp,
      discord: approvalItem.discord,
      facebook: approvalItem.facebook,
      other: approvalItem.other,
    })
    .onConflictDoUpdate({
      target: schema.communities.id,
      set: {
        name: approvalItem.name,
        description: approvalItem.description,
        owner: approvalItem.owner,
        whatsapp: approvalItem.whatsapp,
        discord: approvalItem.discord,
        facebook: approvalItem.facebook,
        other: approvalItem.other,
      },
    })
    .returning();

  const communityId =
    typeof newCommunity?.id === "string" ? newCommunity.id : approvalItem.id;

  const joinRecords = approvalItem.cellIds.map((cellId: string) => ({
    cellId,
    communityId,
  }));

  if (joinRecords.length > 0) {
    await tx
      .insert(schema.cellCommunities)
      .values(joinRecords)
      .onConflictDoNothing();
  }

  await tx
    .delete(schema.approvals)
    .where(eq(schema.approvals.id, approvalItem.id));

  if (approvalItem.ownerEmail != null && FRONTEND_URL != null) {
    await sendEmail({
      to: approvalItem.ownerEmail,
      subject: `Community Approved: ${approvalItem.name}`,
      templateName: "communityApproved",
      variables: {
        communityName: approvalItem.name,
        frontendUrl: FRONTEND_URL,
      },
    });
  }
}

async function handleReject(
  tx: TransactionContext,
  approvalItem: ApprovalItem,
): Promise<void> {
  await tx
    .delete(schema.approvals)
    .where(eq(schema.approvals.id, approvalItem.id));

  if (approvalItem.ownerEmail != null) {
    await sendEmail({
      to: approvalItem.ownerEmail,
      subject: `Submission Update: ${approvalItem.name}`,
      templateName: "communityDenied",
      variables: {
        communityName: approvalItem.name,
      },
    });
  }
}

async function handleAmendments(
  tx: TransactionContext,
  approvalItem: ApprovalItem,
  comments: string,
): Promise<void> {
  await tx
    .update(schema.approvals)
    .set({ status: "amendments_requested", comments })
    .where(eq(schema.approvals.id, approvalItem.id));

  if (approvalItem.ownerEmail != null && FRONTEND_URL != null) {
    await sendEmail({
      to: approvalItem.ownerEmail,
      subject: `Changes required for ${approvalItem.name}`,
      templateName: "communityAmendments",
      variables: {
        communityName: approvalItem.name,
        frontendUrl: FRONTEND_URL,
        comments,
      },
    });
  }
}

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {

  if (!verifyOrigin(event)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden" }),
    };
  }

  try {
    if (!(await isAdmin(event))) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: "Forbidden: Admin group access required",
        }),
      };
    }

    const bodyData = getRequestBody(event);
    const { id, action, comments } = bodyData;

    if (id == null || action == null) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required properties: 'id' and 'action'",
        }),
      };
    }

    const db = await getDatabase();

    const [approvalItem] = await db
      .select()
      .from(schema.approvals)
      .where(eq(schema.approvals.id, id));

    if (approvalItem === undefined) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Approval request record not found" }),
      };
    }

    await db.transaction(async (tx) => {
      switch (action) {
        case "approve":
          await handleApprove(tx, approvalItem);
          break;

        case "reject":
          await handleReject(tx, approvalItem);
          break;

        case "amend":
          if (comments === undefined || comments === "") {
            throw new Error("Comments required for amendments");
          }
          await handleAmendments(tx, approvalItem, comments);
          break;

        default:
          throw new Error("Invalid action provided");
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Action '${action}' applied successfully`,
      }),
    };
  } catch (e: unknown) {
    console.error("Workflow execution error:", e);
    const errorMessage = e instanceof Error ? e.message : "";
    const isClientError =
      typeof errorMessage === "string" &&
      (errorMessage.includes("required") || errorMessage.includes("Invalid"));

    return {
      statusCode: isClientError ? 400 : 500,
      body: JSON.stringify({
        error: errorMessage !== "" ? errorMessage : "Internal Server Error",
      }),
    };
  }
};
