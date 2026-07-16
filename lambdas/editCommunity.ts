import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { eq, and } from "drizzle-orm";
import * as schema from "../database/drizzle/schema";
import { getRequestBody } from "./helpers/request";
import { getOwnerEmail, getUser, verifyOrigin } from "./helpers/auth";
import { sendEmail } from "./helpers/ses";
import { getDatabase, DbInstance, TransactionContext } from "./helpers/db";

interface EditCommunityInput {
  id?: string;
  name?: string;
  description?: string | null;
  whatsapp?: string | null;
  discord?: string | null;
  facebook?: string | null;
  other?: string | null;
  ownerEmail?: string | null;
  cellIds?: string[] | null;
}

type ApprovalRecord = typeof schema.approvals.$inferSelect;

const FRONTEND_URL = process.env.FRONTEND_URL ?? "";

async function fetchCommunityCellIds(
  db: DbInstance,
  communityId: string,
): Promise<string[]> {
  const records = await db
    .select({ cellId: schema.cellCommunities.cellId })
    .from(schema.cellCommunities)
    .where(eq(schema.cellCommunities.communityId, communityId));

  return records.map((r) => r.cellId);
}

function validatePayload(bodyData: EditCommunityInput): string | null {
  if (bodyData == null) {
    return "Invalid request body.";
  }
  const { id, name, description } = bodyData;

  if (id == null || id === "" || name == null) {
    return "Missing fields. 'id', 'name', 'owner', and a non-empty array of 'cellIds' are required.";
  }

  if (name.length > 100) {
    return "Community name cannot exceed 100 characters.";
  }

  if (
    description !== undefined &&
    description !== null &&
    description.length > 3000
  ) {
    return "Description cannot exceed 3000 characters.";
  }

  return null;
}

async function updateExistingApproval(
  tx: TransactionContext,
  input: EditCommunityInput,
  userEmail: string,
): Promise<void> {
  await tx
    .update(schema.approvals)
    .set({
      name: input.name,
      description: input.description !== undefined ? input.description : null,
      whatsapp: input.whatsapp !== undefined ? input.whatsapp : null,
      discord: input.discord !== undefined ? input.discord : null,
      facebook: input.facebook !== undefined ? input.facebook : null,
      other: input.other !== undefined ? input.other : null,
      status: "pending",
      comments: null,
      lastEdited: new Date(),
    })
    .where(
      and(
        eq(schema.approvals.id, input.id!),
        eq(schema.approvals.ownerEmail, userEmail),
      ),
    );
}

async function createNewApprovalRequest(
  tx: TransactionContext,
  input: EditCommunityInput,
  owner: string,
  ownerEmail: string,
  cellIds: string[],
): Promise<ApprovalRecord> {
  const { id, name, description, whatsapp, discord, facebook, other } = input;

  if (name == null) {
    throw new Error("Missing required fields for approval creation");
  }

  const [newApproval] = await tx
    .insert(schema.approvals)
    .values({
      id: id ?? undefined,
      name,
      description: description ?? null,
      owner,
      ownerEmail,
      whatsapp: whatsapp ?? null,
      discord: discord ?? null,
      facebook: facebook ?? null,
      other: other ?? null,
      cellIds,
      status: "pending",
      lastEdited: null,
    })
    .returning();

  return newApproval;
}

async function notifyCommunitySubmission(
  userEmail: string,
  communityName: string,
): Promise<void> {
  await sendEmail({
    to: userEmail,
    subject: `Community Edit Submitted: ${communityName}`,
    templateName: "communityEditSubmitted",
    variables: {
      communityName,
      frontendUrl: FRONTEND_URL,
    },
  });
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
    if (userEmail == null) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: "Unauthorized: Invalid or missing token claims",
        }),
      };
    }

    const bodyData = getRequestBody(event);

    const validationError = validatePayload(bodyData);
    if (validationError != null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: validationError }),
      };
    }

    const input: EditCommunityInput = {
      id: bodyData.id,
      name: bodyData.name,
      description: bodyData.description,
      ownerEmail: userEmail,
      whatsapp: bodyData.whatsapp,
      discord: bodyData.discord,
      facebook: bodyData.facebook,
      other: bodyData.other,
    };

    const targetId = input.id!;
    const owner = await getUser(event);

    const [existingApproval] = await db
      .select()
      .from(schema.approvals)
      .where(
        and(
          eq(schema.approvals.id, targetId),
          eq(schema.approvals.owner, owner!),
        ),
      );

    const [existingCommunity] = await db
      .select()
      .from(schema.communities)
      .where(
        and(
          eq(schema.communities.id, targetId),
          eq(schema.communities.owner, owner!),
        ),
      );

    if (existingApproval !== undefined) {
      await db.transaction(async (tx) => {
        await updateExistingApproval(tx, input, userEmail);
      });

      await notifyCommunitySubmission(userEmail, input.name!);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message:
            "Existing approval request updated and reset to pending status",
        }),
      };
    }

    if (existingCommunity !== undefined && existingApproval === undefined) {
      const cellIds = await fetchCommunityCellIds(db, targetId);

      // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
      let createdRecord: ApprovalRecord | undefined;
      await db.transaction(async (tx) => {
        createdRecord = await createNewApprovalRequest(
          tx,
          input,
          existingCommunity.owner as string,
          userEmail,
          cellIds,
        );
      });

      await notifyCommunitySubmission(userEmail, input.name!);

      return {
        statusCode: 201,
        body: JSON.stringify({
          message:
            "Community edit submission routed to approvals workflow; production community remains unaltered",
          approval: createdRecord,
        }),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({
        error:
          "Target community or approval sequence reference not found, or you do not have permission to access it",
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
