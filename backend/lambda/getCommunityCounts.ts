import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export const handler = async (): Promise<APIGatewayProxyStructuredResultV2> => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
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
      body: JSON.stringify({ error: (e as Error).message }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
