import { randomUUID } from 'crypto';

import type { RunStatus } from '@prisma/client';

import type { RunsService } from '../src/runs/runs.service';
import { rootLogger } from '../src/logger/pino-logger.service';
import type { Step } from '../src/steps/registry';

interface RunRecord {
  id: string;
  workflowId: string;
  status: RunStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  durationMs: number | null;
  errorMessage: string | null;
  log: any;
  spec: any;
}

export class MockPrismaClient {
  private readonly runs = new Map<string, RunRecord>();

  run = {
    create: async ({ data }: { data: any }) => {
      const id = randomUUID();
      const now = new Date();
      const record: RunRecord = {
        id,
        workflowId: data.workflowId,
        status: data.status,
        createdAt: now,
        updatedAt: now,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        errorMessage: null,
        log: data.log ?? null,
        spec: data.spec ?? null,
      };
      this.runs.set(id, record);
      return structuredClone(record);
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const existing = this.runs.get(where.id);
      if (!existing) throw new Error(`Run not found: ${where.id}`);
      Object.assign(existing, data, { updatedAt: new Date() });
      this.runs.set(where.id, existing);
      return structuredClone(existing);
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const record = this.runs.get(where.id);
      return record ? structuredClone(record) : null;
    },
    findMany: async ({ take }: { take?: number } = {}) => {
      const runs = Array.from(this.runs.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      return runs.slice(0, take ?? runs.length).map((r) => structuredClone(r));
    },
  };

  get data() {
    return this.runs;
  }
}

export class StubStepsRegistry {
  constructor(private readonly steps: Record<string, Step>) {}

  get(type: string): Step {
    const step = this.steps[type];
    if (!step) {
      throw new Error(`Unknown step type: ${type}`);
    }
    return step;
  }
}

export function createDefaultSteps(extra?: Record<string, Step>) {
  const base: Record<string, Step> = {
    echo: {
      type: 'echo',
      async run(params, context) {
        return params?.value ?? params?.message ?? context?.previousOutput ?? null;
      },
    },
    delay: {
      type: 'delay',
      async run(params) {
        const ms = Number(params?.ms ?? 0);
        if (ms > 0) {
          await new Promise((resolve) => setTimeout(resolve, ms));
        }
        return ms;
      },
    },
  };

  return new StubStepsRegistry({ ...base, ...(extra ?? {}) });
}

export async function waitForRunStatus(
  service: RunsService,
  runId: string,
  status: RunStatus,
  timeoutMs = 2000,
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const run = await service.getRun(runId);
    if (run?.status === status) {
      return run;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for status ${status}`);
}

export function silenceLogger() {
  rootLogger.level = 'silent';
  rootLogger.info = (() => undefined) as any;
  rootLogger.error = (() => undefined) as any;
  rootLogger.warn = (() => undefined) as any;
  rootLogger.debug = (() => undefined) as any;
  rootLogger.trace = (() => undefined) as any;
  rootLogger.child = (() => rootLogger) as any;
}
