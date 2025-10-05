// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const wf = await prisma.workflow.upsert({
    where: { name_userId: { name: 'runner.basic', userId: 'seed' } } as any,
    update: {},
    create: { name: 'runner.basic', userId: 'seed' },
  });
  console.log('WF ID:', wf.id);
  process.exit(0);
})();
