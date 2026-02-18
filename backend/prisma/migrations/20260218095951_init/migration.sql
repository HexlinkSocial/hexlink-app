-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cell_ids" TEXT[],
    "owner" TEXT NOT NULL,
    "community_link" TEXT,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);
