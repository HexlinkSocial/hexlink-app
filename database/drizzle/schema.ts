import {
  pgTable,
  text,
  uuid,
  primaryKey,
  index,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  owner: text("owner").notNull(),
  whatsapp: text("whatsapp"),
  discord: text("discord"),
  facebook: text("facebook"),
  other: text("other_url"),
  termsAccepted: boolean("terms_accepted").notNull().default(false),
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
  whatsapp: text("whatsapp"),
  discord: text("discord"),
  facebook: text("facebook"),
  other: text("other_url"),
  cellIds: text("cell_ids").array().notNull(),
  termsAccepted: boolean("terms_accepted").notNull().default(false),
  status: text("status").notNull().default("pending"),
  comments: text("comments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastEdited: timestamp("last_edited"),
});

export const tileGenerationState = pgTable("tile_generation_state", {
  id: text("id").primaryKey().default("singleton"),
  newCommunitiesAdded: boolean("new_communities_added")
    .notNull()
    .default(false),
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
