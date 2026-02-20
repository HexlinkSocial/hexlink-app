import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CommunityCount } from "../../src/objects/CommunityCount";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// TODO or returns error
export const handler = async (): Promise<CommunityCount[]> => {
  try {
    const communities = await prisma.cellCommunity.groupBy({
      by: ["cellId"],
      _count: {
        cellId: true,
      },
    });

    return communities.map(
      (c) => new CommunityCount(c.cellId, Number(c._count.cellId)),
    );
  } catch (error) {
    throw new Error("Failed to fetch communities");
  }
};
