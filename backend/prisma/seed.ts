import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import * as h3 from "h3-js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function generateConnectedH3Cells(count: number): string[] {
  // Change these to suit your selected area
  const lat = faker.number.float({ min: 51.402975, max: 51.592357 });
  const lng = faker.number.float({ min: -0.273258, max: 0.119099 });

  const center = h3.latLngToCell(lat, lng, 8);
  const disk = h3.gridDisk(center, 1);

  const shuffled = faker.helpers.shuffle(disk);
  return shuffled.slice(0, count);
}

async function main(): Promise<void> {
  try {
    console.log("Seeding...");

    await prisma.community.deleteMany();

    for (let i = 0; i < 20; i++) {
      const newCommunity = await prisma.community.create({
        data: {
          name: faker.company.name(),
          description: faker.lorem.paragraph(),
          owner: faker.string.uuid(),
          community_link: faker.internet.url(),
        },
      });

      const cellIds = generateConnectedH3Cells(
        faker.number.int({ min: 3, max: 7 }),
      );
      for (const cellId of cellIds) {
        await prisma.cellCommunity.create({
          data: {
            cellId,
            communityId: newCommunity.id,
          },
        });
      }
    }

    console.log("Seeding finished.");
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
