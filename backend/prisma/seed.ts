import { PrismaClient } from '@prisma/client'
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from '@faker-js/faker'
import * as h3 from 'h3-js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function generateConnectedH3Cells(count: number): string[] {
  // Change these to suit your selected area
  const lat = faker.number.float({ min: 51.402975, max: 51.592357 })
  const lng = faker.number.float({ min: -0.273258, max: 0.119099 })

  const center = h3.latLngToCell(lat, lng, 8)
  const disk = h3.gridDisk(center, 1)

  const shuffled = faker.helpers.shuffle(disk)
  return shuffled.slice(0, count)
}

async function main() {
  console.log('Seeding...')

  await prisma.community.deleteMany()

  for (let i = 0; i < 20; i++) {
    await prisma.community.create({
      data: {
        name: faker.company.name(),
        description: faker.lorem.paragraph(),
        cell_ids: generateConnectedH3Cells(Math.floor(Math.random() * 10) + 1),
        owner: faker.string.uuid(),
        community_link: faker.internet.url(),
      },
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
