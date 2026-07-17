CREATE TABLE "tile_generation_state" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"new_communities_added" boolean DEFAULT false NOT NULL
);
