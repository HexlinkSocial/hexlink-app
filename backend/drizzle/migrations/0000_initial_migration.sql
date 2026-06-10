CREATE TABLE "cell_communities" (
	"cellId" text NOT NULL,
	"communityId" uuid NOT NULL,
	CONSTRAINT "cell_communities_cellId_communityId_pk" PRIMARY KEY("cellId","communityId")
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner" text NOT NULL,
	"community_link" text
);
--> statement-breakpoint
ALTER TABLE "cell_communities" ADD CONSTRAINT "cell_communities_communityId_communities_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cell_communities_cellId_idx" ON "cell_communities" USING btree ("cellId");