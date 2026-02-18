import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const handler = async () => {
  try {
    const communities = await prisma.$queryRaw<{ cell_id: string, community_count: bigint }[]>`
      SELECT cell_id, COUNT(*) as community_count
      FROM communities, UNNEST(cell_ids) as cell_id
      GROUP BY cell_id;
    `;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(communities.map(c => ({
        cell_id: c.cell_id,
        community_count: Number(c.community_count),
      }))),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch communities" }),
    };
  }
};
