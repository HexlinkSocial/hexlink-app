import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CommunityCount } from "../src/objects/CommunityCount";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// TODO or returns error
export const handler = async (): Promise<CommunityCount[]> => {
  try {
    const communities = await prisma.$queryRaw<
      { cell_id: string; community_count: bigint }[]
    >`
      SELECT cell_id, COUNT(*) as community_count
      FROM communities, UNNEST(cell_ids) as cell_id
      GROUP BY cell_id;
    `;

    return communities.map((c) => ({
      cell_id: c.cell_id,
      community_count: Number(c.community_count),
    }));
  } catch (error) {
    throw new Error("Failed to fetch communities");
  }
};
