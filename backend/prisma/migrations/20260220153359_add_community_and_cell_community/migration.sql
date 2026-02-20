-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT NOT NULL,
    "community_link" TEXT,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cell_communities" (
    "cellId" TEXT NOT NULL,
    "communityId" UUID NOT NULL,

    CONSTRAINT "cell_communities_pkey" PRIMARY KEY ("cellId","communityId")
);

-- CreateIndex
CREATE INDEX "cell_communities_cellId_idx" ON "cell_communities"("cellId");

-- AddForeignKey
ALTER TABLE "cell_communities" ADD CONSTRAINT "cell_communities_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
