import { drizzle } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import * as h3 from "h3-js";
import { Pool } from "pg";
import { communities, cellCommunities } from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

function generateConnectedH3Cells(count: number): string[] {
  const lat = faker.number.float({ min: 51.402975, max: 51.592357 });
  const lng = faker.number.float({ min: -0.273258, max: 0.119099 });

  const center = h3.latLngToCell(lat, lng, 8);
  const disk = h3.gridDisk(center, 1);

  const shuffled = faker.helpers.shuffle(disk);
  return shuffled.slice(0, count);
}

function generatePlatformLinks(): {
  whatsapp: string | null;
  discord: string | null;
  facebook: string | null;
  other: string | null;
} {
  const randomSuffix = () => faker.string.alphanumeric(10);
  
  const platforms = [
    { key: "whatsapp", value: () => `https://chat.whatsapp.com/${randomSuffix()}` },
    { key: "discord", value: () => faker.helpers.arrayElement([`https://discord.gg/${randomSuffix()}`, `https://discord.com/${randomSuffix()}`]) },
    { key: "facebook", value: () => `https://facebook.com/groups/${randomSuffix()}` },
    { key: "other", value: () => faker.internet.url() },
  ];

  const shuffledPlatforms = faker.helpers.shuffle(platforms);
  const fieldsCount = faker.number.int({ min: 1, max: 4 });
  const selectedPlatforms = shuffledPlatforms.slice(0, fieldsCount);

  const links = {
    whatsapp: null,
    discord: null,
    facebook: null,
    other: null,
  };

  for (const platform of selectedPlatforms) {
    links[platform.key as keyof typeof links] = platform.value();
  }

  return links;
}

async function main(): Promise<void> {
  try {
    console.log("Seeding...");
    await db.delete(communities);

    for (let i = 0; i < 20; i++) {
      const platformLinks = generatePlatformLinks();

      const [newCommunity] = await db
        .insert(communities)
        .values({
          name: faker.company.name(),
          description: faker.lorem.paragraph(),
          owner: faker.string.uuid(),
          ...platformLinks,
        })
        .returning();

      const cellIds = generateConnectedH3Cells(
        faker.number.int({ min: 3, max: 7 }) as number,
      );

      const junctionRows = cellIds.map((cellId) => ({
        cellId,
        communityId: newCommunity.id,
      }));

      if (junctionRows.length > 0) {
        await db.insert(cellCommunities).values(junctionRows);
      }
    }

    console.log("Seeding finished.");
  } catch (e) {
    console.error(e);
    throw e;
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
