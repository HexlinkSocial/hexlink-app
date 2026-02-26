import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const handler = async (): Promise<APIGatewayProxyStructuredResultV2> => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const communities = await prisma.cellCommunity.groupBy({
      by: ["cellId"],
      _count: { cellId: true },
    });
    const result = communities.map((c) => ({
      cellId: c.cellId,
      communityCount: Number(c._count.cellId),
    }));
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: "Error: " + JSON.stringify({ error: (e as Error).message }),
    };
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
};
