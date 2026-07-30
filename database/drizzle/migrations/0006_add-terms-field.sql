ALTER TABLE "approvals" ADD COLUMN "terms_accepted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "terms_accepted" boolean DEFAULT false NOT NULL;