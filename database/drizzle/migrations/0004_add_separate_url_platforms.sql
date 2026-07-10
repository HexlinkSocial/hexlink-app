ALTER TABLE "approvals" RENAME COLUMN "community_link" TO "other_url";--> statement-breakpoint
ALTER TABLE "communities" RENAME COLUMN "community_link" TO "other_url";--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "whatsapp" text;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "discord" text;--> statement-breakpoint
ALTER TABLE "approvals" ADD COLUMN "facebook" text;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "whatsapp" text;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "discord" text;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "facebook" text;