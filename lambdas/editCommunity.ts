import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import * as schema from "../database/drizzle/schema";
import { getRequestBody } from "./helpers/request";
import { getOwnerEmail, getUser } from "./helpers/auth";

// Supabase pooler uses a self-signed cert chain not trusted by Node's
// default CA bundle. Disable verification for database connections only.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  max: 1,
});

const db = drizzle(pool, { schema });

type DbInstance = typeof db;
type TransactionContext = Parameters<
  Parameters<DbInstance["transaction"]>[0]
>[0];

interface EditCommunityInput {
  id?: string;
  name?: string;
  description?: string | null;
  communityLink?: string | null;
  ownerEmail?: string | null;
  cellIds?: string[] | null;
}

type ApprovalRecord = typeof schema.approvals.$inferSelect;

async function fetchCommunityCellIds(communityId: string): Promise<string[]> {
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
      communityLink:
        input.communityLink !== undefined ? input.communityLink : null,
      status: "pending",
      comments: null,
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
  const { id, name, description, communityLink } = input;

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
      communityLink: communityLink ?? null,
      cellIds,
      status: "pending",
    })
    .returning();

  return newApproval;
}

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
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
      communityLink: bodyData.communityLink,
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

      return {
        statusCode: 200,
        body: JSON.stringify({
          message:
            "Existing approval request updated and reset to pending status",
        }),
      };
    }

    if (existingCommunity !== undefined && existingApproval === undefined) {
      const cellIds = await fetchCommunityCellIds(targetId);

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
