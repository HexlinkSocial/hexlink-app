CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner" text NOT NULL,
	"community_link" text,
	"cell_ids" text[] NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"comments" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
