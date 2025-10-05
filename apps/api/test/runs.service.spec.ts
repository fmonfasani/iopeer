import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RunStatus } from '@prisma/client';

import { RunsService } from '../src/runs/runs.service';
import { createDefaultSteps, MockPrismaClient, silenceLogger, waitForRunStatus } from './utils';

const WORKFLOW_ID = '00000000-0000-0000-0000-000000000001';

describe('RunsService', () => {
  beforeAll(() => {
    silenceLogger();
  });

  let prisma: MockPrismaClient;
  let service: RunsService;

  beforeEach(() => {
    prisma = new MockPrismaClient();
    const stepsRegistry = createDefaultSteps();
    service = new RunsService(
      prisma as unknown as any,
      stepsRegistry as unknown as any,
    );
  });

  it('enqueue + execute workflow updates timestamps and stats', async () => {
    const nodes = [
      { id: 'n1', type: 'echo', params: { value: 'hola' } },
      { id: 'n2', type: 'delay', params: { ms: 5 } },
      { id: 'n3', type: 'echo', params: { value: 'chau' } },
    ];

    const runId = await service.enqueueRun({
      workflowId: WORKFLOW_ID,
      nodes,
      requestId: 'req-123',
    });

    const run = await waitForRunStatus(service, runId, RunStatus.SUCCESS);

    expect(run).not.toBeNull();
    expect(run?.status).toBe(RunStatus.SUCCESS);
    expect(run?.startedAt).toBeInstanceOf(Date);
    expect(run?.finishedAt).toBeInstanceOf(Date);
    const duration = run!.finishedAt!.getTime() - run!.startedAt!.getTime();
    expect(run?.durationMs).toBe(duration);

    const stats = service.getStats();
    expect(stats.runs_total).toBe(1);
    expect(stats.runs_success).toBe(1);
    expect(stats.runs_error).toBe(0);
    expect(stats.error_rate).toBe(0);
    expect(stats.step_duration_ms_p95).toBeGreaterThan(0);
  });

  it('captures errors and updates metrics', async () => {
    const steps = createDefaultSteps({
      fail: {
        type: 'fail',
        async run() {
          throw new Error('boom');
        },
      },
    });
    service = new RunsService(prisma as unknown as any, steps as unknown as any);

    const nodes = [
      { id: 'n1', type: 'fail' },
    ];

    const runId = await service.enqueueRun({
      workflowId: WORKFLOW_ID,
      nodes,
      requestId: 'req-err',
    });

    const run = await waitForRunStatus(service, runId, RunStatus.ERROR);
    expect(run?.status).toBe(RunStatus.ERROR);
    expect(run?.errorMessage).toContain('boom');

    const stats = service.getStats();
    expect(stats.runs_total).toBe(1);
    expect(stats.runs_error).toBe(1);
    expect(stats.error_rate).toBe(1);
  });
});
