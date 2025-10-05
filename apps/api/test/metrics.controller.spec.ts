import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RunStatus } from '@prisma/client';

import { MetricsController } from '../src/metrics/metrics.controller';
import { RunsService } from '../src/runs/runs.service';
import {
  createDefaultSteps,
  MockPrismaClient,
  silenceLogger,
  waitForRunStatus,
} from './utils';

describe('MetricsController', () => {
  beforeAll(() => {
    silenceLogger();
  });

  let prisma: MockPrismaClient;
  let service: RunsService;
  let controller: MetricsController;

  beforeEach(() => {
    prisma = new MockPrismaClient();
    const steps = createDefaultSteps({
      fail: {
        type: 'fail',
        async run() {
          throw new Error('step failed');
        },
      },
    });
    service = new RunsService(prisma as unknown as any, steps as unknown as any);
    controller = new MetricsController(service);
  });

  it('returns aggregated metrics from RunsService', async () => {
    const successNodes = [{ id: 'n1', type: 'echo', params: { value: 'ok' } }];
    const failureNodes = [{ id: 'n1', type: 'fail' }];

    const run1 = await service.enqueueRun({
      workflowId: '00000000-0000-0000-0000-000000000001',
      nodes: successNodes,
      requestId: 'r1',
    });
    const run2 = await service.enqueueRun({
      workflowId: '00000000-0000-0000-0000-000000000001',
      nodes: successNodes,
      requestId: 'r2',
    });
    const run3 = await service.enqueueRun({
      workflowId: '00000000-0000-0000-0000-000000000001',
      nodes: failureNodes,
      requestId: 'r3',
    });

    await waitForRunStatus(service, run1, RunStatus.SUCCESS);
    await waitForRunStatus(service, run2, RunStatus.SUCCESS);
    await waitForRunStatus(service, run3, RunStatus.ERROR);

    const metrics = controller.get();

    expect(metrics.runs_total).toBe(3);
    expect(metrics.runs_success).toBe(2);
    expect(metrics.runs_error).toBe(1);
    expect(metrics.error_rate).toBeCloseTo(1 / 3, 3);
    expect(metrics.step_duration_ms_p95).toBeGreaterThanOrEqual(0);
  });
});
