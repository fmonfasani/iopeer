import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = '00000000-0000-0000-0000-000000000001';

  // Crear user
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  // Crear workflow
  const wf = await prisma.workflow.upsert({
    where: { key: 'wf.health' },
    update: {},
    create: {
      userId,
      key: 'wf.health',
      name: 'Health Check Workflow',
      description: 'Ejecuta una tarea simple para validar el pipeline.',
      isActive: true,
    },
  });

  // Crear tasks
  const t1 = await prisma.task.upsert({
    where: { workflowId_key: { workflowId: wf.id, key: 'task.ping' } },
    update: {},
    create: {
      workflowId: wf.id,
      key: 'task.ping',
      name: 'Ping',
      type: 'script',
      config: { cmd: 'echo "pong"' },
      order: 1,
      isEntry: true,
    },
  });

  const t2 = await prisma.task.upsert({
    where: { workflowId_key: { workflowId: wf.id, key: 'task.finish' } },
    update: {},
    create: {
      workflowId: wf.id,
      key: 'task.finish',
      name: 'Finish',
      type: 'noop',
      config: {},
      order: 2,
    },
  });

  // Gate
  await prisma.gate
    .create({
      data: {
        fromTaskId: t1.id,
        toTaskId: t2.id,
        condition: 'status == "SUCCESS"',
        state: 'CLOSED',
      },
    })
    .catch(() => {});

  // Schedule
  await prisma.schedule.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      workflowId: wf.id,
      cron: '*/5 * * * *',
      timezone: 'America/Argentina/Buenos_Aires',
      isActive: true,
    },
  });

  console.log('✅ Seed OK');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
