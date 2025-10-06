import { PrismaClient, RunStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const workflows = [
    {
      key: 'wf.health',
      name: 'Health Check',
      description: 'Estado general del sistema',
    },
    {
      key: 'wf.scheduler',
      name: 'Scheduler Core',
      description: 'Tareas programadas',
    },
    {
      key: 'wf.metrics',
      name: 'Daily Metrics',
      description: 'Métricas diarias',
    },
  ];

  for (const wf of workflows) {
    await prisma.workflow.upsert({
      where: { key: wf.key },
      update: { name: wf.name, description: wf.description, isActive: true },
      create: {
        key: wf.key,
        name: wf.name,
        description: wf.description,
        isActive: true,
      },
    });
  }

  await prisma.user.upsert({
    where: { email: 'demo@iopeer.local' },
    update: { name: 'Demo User' },
    create: { email: 'demo@iopeer.local', name: 'Demo User' },
  });

  const health = await prisma.workflow.findUnique({
    where: { key: 'wf.health' },
  });
  if (health) {
    const now = new Date();
    await prisma.run.create({
      data: {
        workflowId: health.id,
        status: RunStatus.SUCCESS,
        startedAt: new Date(now.getTime() - 3000),
        finishedAt: now,
        meta: { init: true },
      },
    });
    await prisma.run.create({
      data: {
        workflowId: health.id,
        status: RunStatus.ERROR,
        startedAt: new Date(now.getTime() - 5000),
        finishedAt: new Date(now.getTime() - 4000),
        error: 'Seeded error example',
      },
    });
  }

  console.log('✅ Seed ejecutado correctamente');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
