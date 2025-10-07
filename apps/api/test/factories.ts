import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { RUN_STATUS } from '../src/runs/run-status';

export type MockedPrismaResult = {
  client: PrismaClient;
  runStore: Map<string, any>;
  workflowStore: Map<string, any>;
};

export function createMockPrismaClient(
  initialRuns: Array<Partial<Prisma.Run>> = [],
  initialWorkflows: Array<Partial<Prisma.Workflow>> = [],
): MockedPrismaResult {
  const runStore = new Map<string, any>();
  const workflowStore = new Map<string, any>();

  initialRuns.forEach((run) => {
    const id = run.id ?? randomUUID();
    runStore.set(id, {
      id,
      workflowId: run.workflowId ?? 'wf',
      status: run.status ?? RUN_STATUS.PENDING,
      startedAt: run.startedAt ?? new Date(),
      finishedAt: run.finishedAt ?? null,
      log: run.log ?? null,
      ...run,
    });
  });

  initialWorkflows.forEach((workflow) => {
    const id = workflow.id ?? randomUUID();
    const key = workflow.key ?? id;
    workflowStore.set(id, {
      id,
      key,
      name: workflow.name ?? key,
      description: workflow.description ?? null,
      isActive: workflow.isActive ?? true,
      createdAt: workflow.createdAt ?? new Date(),
      updatedAt: workflow.updatedAt ?? new Date(),
    });
  });

  const runModel = {
    create: vi.fn(async ({ data }: { data: Prisma.RunCreateInput }) => {
      const id = (data as any).id ?? randomUUID();
      const stored = {
        id,
        workflowId: data.workflowId,
        status: data.status ?? RUN_STATUS.PENDING,
        startedAt: (data as any).startedAt ?? new Date(),
        finishedAt: (data as any).finishedAt ?? null,
        log: (data as any).log ?? null,
      };
      runStore.set(id, { ...stored });
      return { ...stored } as Prisma.Run;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
      const current = runStore.get(where.id);
      if (!current) {
        throw new Error(`Run ${where.id} not found`);
      }
      const updated = {
        ...current,
        ...data,
        ...(Object.prototype.hasOwnProperty.call(data, 'log')
          ? { log: data.log }
          : { log: current.log }),
      };
      runStore.set(where.id, updated);
      return { ...updated };
    }),
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      const match = runStore.get(where.id);
      return match ? { ...match } : null;
    }),
    findMany: vi.fn(async (args: any = {}) => {
      let values = Array.from(runStore.values()).map((r) => ({ ...r }));
      if (args.where?.status?.equals) {
        values = values.filter((r) => r.status === args.where.status.equals);
      }
      if (args.orderBy?.finishedAt === 'desc') {
        values.sort(
          (a, b) =>
            (b.finishedAt ? new Date(b.finishedAt).getTime() : 0) -
            (a.finishedAt ? new Date(a.finishedAt).getTime() : 0),
        );
      } else if (args.orderBy?.startedAt === 'desc') {
        values.sort(
          (a, b) =>
            (b.startedAt ? new Date(b.startedAt).getTime() : 0) -
            (a.startedAt ? new Date(a.startedAt).getTime() : 0),
        );
      }
      if (typeof args.take === 'number') {
        values = values.slice(0, args.take);
      }
      return values;
    }),
    count: vi.fn(async (args: any = {}) => {
      let values = Array.from(runStore.values());
      if (args.where?.status?.equals) {
        values = values.filter((r) => r.status === args.where.status.equals);
      }
      return values.length;
    }),
  };

  const workflowModel = {
    findUnique: vi.fn(async ({ where }: { where: { id?: string; key?: string } }) => {
      if (where.id) {
        const match = workflowStore.get(where.id);
        return match ? { ...match } : null;
      }
      if (where.key) {
        const match = Array.from(workflowStore.values()).find((wf) => wf.key === where.key);
        return match ? { ...match } : null;
      }
      return null;
    }),
    create: vi.fn(async ({ data }: { data: Prisma.WorkflowCreateInput }) => {
      const id = (data as any).id ?? randomUUID();
      const stored = {
        id,
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      workflowStore.set(id, stored);
      return { ...stored } as Prisma.Workflow;
    }),
    upsert: vi.fn(async ({
      where,
      create,
      update,
    }: {
      where: { key: string };
      create: Prisma.WorkflowCreateInput;
      update: Prisma.WorkflowUpdateInput;
    }) => {
      const existing = Array.from(workflowStore.values()).find((wf) => wf.key === where.key);
      if (existing) {
        const updated = { ...existing, ...update, updatedAt: new Date() };
        workflowStore.set(existing.id, updated);
        return { ...updated } as Prisma.Workflow;
      }
      const id = (create as any).id ?? randomUUID();
      const stored = {
        id,
        key: create.key,
        name: create.name,
        description: create.description ?? null,
        isActive: create.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      workflowStore.set(id, stored);
      return { ...stored } as Prisma.Workflow;
    }),
  };

  const client = {
    run: runModel,
    workflow: workflowModel,
    $queryRaw: vi.fn(async () => 1),
  } as unknown as PrismaClient;

  return { client, runStore, workflowStore };
}

export async function createTestingApp(overrides?: {
  prisma?: PrismaClient;
}): Promise<{
  app: INestApplication;
  prisma: PrismaClient;
  request: request.SuperTest<request.Test>;
  runStore: Map<string, any>;
}> {
  const mock = overrides?.prisma
    ? { client: overrides.prisma, runStore: new Map<string, any>() }
    : createMockPrismaClient();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaClient)
    .useValue(mock.client)
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  const server = app.getHttpServer();

  return { app, prisma: mock.client, request: request(server), runStore: mock.runStore };
}
