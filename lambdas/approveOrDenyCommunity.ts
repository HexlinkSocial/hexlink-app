import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "../database/drizzle/schema";
import { getRequestBody } from "./helpers/request";
import { isAdmin } from "./helpers/auth";

type ApprovalItem = typeof schema.approvals.$inferSelect;
type DbInstance = typeof db;
type TransactionContext = Parameters<
  Parameters<DbInstance["transaction"]>[0]
>[0];

// Supabase pooler uses a self-signed cert chain not trusted by Node's
// default CA bundle. Disable verification for database connections only.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? true : false,
  max: 1,
});

const db = drizzle(pool, { schema });

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
      communityLink: approvalItem.communityLink,
    })
    .onConflictDoUpdate({
      target: schema.communities.id,
      set: {
        name: approvalItem.name,
        description: approvalItem.description,
        owner: approvalItem.owner,
        communityLink: approvalItem.communityLink,
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
}

async function handleReject(tx: TransactionContext, id: string): Promise<void> {
  await tx.delete(schema.approvals).where(eq(schema.approvals.id, id));
}

async function handleAmendments(
  tx: TransactionContext,
  id: string,
  comments: string,
): Promise<void> {
  await tx
    .update(schema.approvals)
    .set({ status: "amendments_requested", comments })
    .where(eq(schema.approvals.id, id));
}

export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
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
          await handleReject(tx, id);
          break;

        case "amend":
          if (comments === undefined || comments === "") {
            throw new Error("Comments required for amendments");
          }
          await handleAmendments(tx, id, comments);
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
