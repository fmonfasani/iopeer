// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WORKFLOWS = [
  {
    id: '7f1f9e2e-2b66-4c2e-a1d4-8a7b7e9b3c01',
    key: 'wf.health',
    name: 'Health check',
  },
  {
    id: '0a7f3c9b-6e15-4a2d-9d6a-2e1b4f3a9c02',
    key: 'wf.prisma.migrate',
    name: 'Prisma migrate',
  },
  {
    id: 'e3b2c5d6-7a89-4b01-9c23-4d5e6f7a8b03',
    key: 'wf.runner.basic',
    name: 'Runner basic',
  },
  {
    id: '12c4d6e8-90ab-4cde-b123-4567abcd8904',
    key: 'wf.quality',
    name: 'Quality checks',
  },
  {
    id: '98ba7654-3210-4fed-ba98-76543210dc05',
    key: 'wf.delivery',
    name: 'Delivery pipeline',
  },
  {
    id: 'wf.test',
    key: 'wf.test',
    name: 'Test workflow',
  },
];

async function main() {
  for (const workflow of WORKFLOWS) {
    await prisma.workflow.upsert({
      where: { key: workflow.key },
      update: {
        name: workflow.name,
      },
      create: {
        id: workflow.id,
        key: workflow.key,
        name: workflow.name,
      },
    });
  }

  const workflows = await prisma.workflow.findMany({ orderBy: { key: 'asc' } });
  console.log(`Seeded ${workflows.length} workflows`);
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
