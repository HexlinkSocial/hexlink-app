import {
  pgTable,
  text,
  uuid,
  primaryKey,
  index,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  owner: text("owner").notNull(),
  communityLink: text("community_link"),
});

export const cellCommunities = pgTable(
  "cell_communities",
  {
    cellId: text("cellId").notNull(),
    communityId: uuid("communityId")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.cellId, table.communityId] }),
    index("cell_communities_cellId_idx").on(table.cellId),
  ],
);

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  owner: text("owner").notNull(),
  ownerEmail: text("owner_email").notNull(),
  communityLink: text("community_link"),
  cellIds: text("cell_ids").array().notNull(),
  status: text("status").notNull().default("pending"),
  comments: text("comments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const communitiesRelations = relations(communities, ({ many }) => ({
  cellCommunities: many(cellCommunities),
}));

export const cellCommunitiesRelations = relations(
  cellCommunities,
  ({ one }) => ({
    community: one(communities, {
      fields: [cellCommunities.communityId],
      references: [communities.id],
    }),
  }),
);
