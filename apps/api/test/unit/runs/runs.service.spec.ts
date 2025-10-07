import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { RunsService } from '../../../src/runs/runs.service';
import { StepsRegistry } from '../../../src/steps/registry';
import { RUN_STATUS } from '../../../src/runs/run-status';
import { createMockPrismaClient } from '../../factories';

describe('RunsService', () => {
  it('createRun persists run with queued status', async () => {
    const mockPrisma = createMockPrismaClient();
    const steps = { get: vi.fn().mockReturnValue({ run: vi.fn() }) } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    const run = await runsService.createRun('wf-1', [{ id: 'n1', type: 'echo' }]);

    expect(mockPrisma.client.run.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workflowId: 'wf-1',
          status: RUN_STATUS.PENDING,
        }),
      }),
    );
    expect(run.status).toBe(RUN_STATUS.PENDING);
  });

  it('createRun clones provided metadata into the log', async () => {
    const mockPrisma = createMockPrismaClient();
    const steps = { get: vi.fn().mockReturnValue({ run: vi.fn() }) } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    const processSpy = vi
      .spyOn(runsService as any, 'processNext')
      .mockResolvedValue(undefined);

    const run = await runsService.createRun(
      'wf-meta',
      [{ type: 'echo' }],
      { actionId: 'step-1', attempt: 0 },
    );

    processSpy.mockRestore();

    const storedRun = mockPrisma.runStore.get(run.id);
    expect(storedRun.log.meta).toEqual({ actionId: 'step-1', attempt: 0 });
    expect(storedRun.log.attempts).toBe(0);
  });

  it('processNext executes steps and marks run as succeeded', async () => {
    const mockPrisma = createMockPrismaClient();
    const stepResult = { ok: true };
    const step = { run: vi.fn().mockResolvedValue(stepResult) };
    const steps = { get: vi.fn().mockReturnValue(step) } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    const processNextSpy = vi
      .spyOn(runsService as any, 'processNext')
      .mockResolvedValue(undefined);

    const run = await runsService.createRun('wf', [{ id: 'n1', type: 'echo', params: { foo: 'bar' } }]);

    processNextSpy.mockRestore();
    await (runsService as any).processNext();

    expect(steps.get).toHaveBeenCalledWith('echo');
    expect(step.run).toHaveBeenCalledWith({ foo: 'bar' });

    const storedRun = mockPrisma.runStore.get(run.id);
    expect(storedRun.status).toBe(RUN_STATUS.SUCCESS);
    expect(storedRun.log.stepLogs).toHaveLength(1);
    expect(storedRun.log.stepLogs[0]).toMatchObject({ status: 'OK', output: stepResult });
  });

  it('processNext marks run as failed when step throws and attempts exhausted', async () => {
    const mockPrisma = createMockPrismaClient();
    const failingStep = { run: vi.fn().mockRejectedValue(new Error('boom')) };
    const steps = { get: vi.fn().mockReturnValue(failingStep) } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    const processNextSpy = vi
      .spyOn(runsService as any, 'processNext')
      .mockResolvedValue(undefined);

    const run = await runsService.createRun('wf', [{ id: 'n1', type: 'echo' }]);

    processNextSpy.mockRestore();
    mockPrisma.runStore.set(run.id, {
      ...mockPrisma.runStore.get(run.id),
      log: { attempts: 2, maxAttempts: 3, stepLogs: [] },
    });

    await (runsService as any).processNext();

    const storedRun = mockPrisma.runStore.get(run.id);
    expect(storedRun.status).toBe(RUN_STATUS.ERROR);
    expect(storedRun.log.error).toContain('boom');
    expect(failingStep.run).toHaveBeenCalled();
  });

  it('requeues run when attempts remain', async () => {
    vi.useFakeTimers();
    const mockPrisma = createMockPrismaClient();
    const failingStep = { run: vi.fn().mockRejectedValue(new Error('retry')) };
    const steps = { get: vi.fn().mockReturnValue(failingStep) } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    const processNextSpy = vi
      .spyOn(runsService as any, 'processNext')
      .mockResolvedValue(undefined);

    const run = await runsService.createRun('wf', [{ id: 'n1', type: 'echo' }]);

    processNextSpy.mockRestore();
    await (runsService as any).processNext();

    const storedRun = mockPrisma.runStore.get(run.id);
    expect(storedRun.status).toBe(RUN_STATUS.PENDING);
    expect(storedRun.log.nextAttemptAt).toBeTruthy();

    await vi.runOnlyPendingTimersAsync();
    vi.useRealTimers();
  });

  it('returns when already processing', async () => {
    const mockPrisma = createMockPrismaClient();
    const steps = { get: vi.fn() } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    (runsService as any).queue.push({
      runId: 'pending',
      workflowId: 'wf',
      nodes: [],
      meta: undefined,
      attempt: 0,
    });
    (runsService as any).processing = true;
    await (runsService as any).processNext();

    expect((runsService as any).queue).toHaveLength(1);
    expect(mockPrisma.client.run.findUnique).not.toHaveBeenCalled();
  });

  it('returns immediately when there is no job to process', async () => {
    const mockPrisma = createMockPrismaClient();
    const steps = { get: vi.fn() } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    await (runsService as any).processNext();

    expect(mockPrisma.client.run.findUnique).not.toHaveBeenCalled();
  });

  it('skips jobs for missing runs', async () => {
    const mockPrisma = createMockPrismaClient();
    const steps = { get: vi.fn() } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    (runsService as any).queue.push({
      runId: 'missing',
      workflowId: 'wf',
      nodes: [],
      meta: undefined,
      attempt: 0,
    });

    await (runsService as any).processNext();
    expect(mockPrisma.client.run.findUnique).toHaveBeenCalledWith({ where: { id: 'missing' } });
    expect(mockPrisma.client.run.update).not.toHaveBeenCalled();
  });

  it('normalises run log defaults when log is missing properties', async () => {
    const mockPrisma = createMockPrismaClient();
    const step = { run: vi.fn().mockResolvedValue(undefined) };
    const steps = { get: vi.fn().mockReturnValue(step) } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    const runId = 'logless-run';
    mockPrisma.runStore.set(runId, {
      id: runId,
      workflowId: 'wf',
      status: RUN_STATUS.PENDING,
      startedAt: null,
      finishedAt: null,
      log: { stepLogs: 'invalid' } as any,
    });

    (runsService as any).queue.push({
      runId,
      workflowId: 'wf',
      nodes: [{ type: 'echo' }],
      meta: undefined,
      attempt: 0,
    });

    await (runsService as any).processNext();

    const stored = mockPrisma.runStore.get(runId);
    expect(Array.isArray(stored.log.stepLogs)).toBe(true);
    expect(stored.log.attempts).toBe(0);
    expect(stored.log.maxAttempts).toBeGreaterThan(0);
    expect(stored.startedAt).not.toBeNull();
    expect(stored.log.stepLogs[0]).toMatchObject({ id: 'echo', status: 'OK' });
  });

  it('continues processing when more jobs remain in the queue', async () => {
    const mockPrisma = createMockPrismaClient([
      { id: 'run-1', workflowId: 'wf', status: RUN_STATUS.PENDING, log: { stepLogs: [] } as any },
      { id: 'run-2', workflowId: 'wf', status: RUN_STATUS.PENDING, log: { stepLogs: [] } as any },
    ]);
    const step = { run: vi.fn().mockResolvedValue(undefined) };
    const steps = { get: vi.fn().mockReturnValue(step) } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    (runsService as any).queue.push(
      { runId: 'run-1', workflowId: 'wf', nodes: [{ type: 'echo' }], meta: undefined, attempt: 0 },
      { runId: 'run-2', workflowId: 'wf', nodes: [{ type: 'echo' }], meta: undefined, attempt: 0 },
    );

    await (runsService as any).processNext();
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockPrisma.client.run.findUnique).toHaveBeenCalledTimes(2);
    expect(step.run).toHaveBeenCalledTimes(2);
  });

  it('handleRunFailure ignores missing runs', async () => {
    const mockPrisma = createMockPrismaClient();
    const steps = { get: vi.fn() } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    await (runsService as any).handleRunFailure(
      { runId: 'missing', workflowId: 'wf', nodes: [], meta: undefined, attempt: 0 },
      new Error('nope'),
    );

    expect(mockPrisma.client.run.update).not.toHaveBeenCalled();
  });

  it('handleRunFailure records string errors and marks run as failed', async () => {
    const mockPrisma = createMockPrismaClient();
    const steps = { get: vi.fn() } as unknown as StepsRegistry;
    const runsService = new RunsService(mockPrisma.client, steps);

    const processSpy = vi
      .spyOn(runsService as any, 'processNext')
      .mockResolvedValue(undefined);

    const run = await runsService.createRun('wf', [{ id: 'node-1', type: 'echo' }]);
    processSpy.mockRestore();
    (runsService as any).queue.length = 0;
    mockPrisma.runStore.set(run.id, {
      ...mockPrisma.runStore.get(run.id),
      status: RUN_STATUS.RUNNING,
      log: { attempts: 2, maxAttempts: 3, stepLogs: [] },
    });

    await (runsService as any).handleRunFailure(
      { runId: run.id, workflowId: 'wf', nodes: [], meta: undefined, attempt: 0 },
      'catastrophic',
    );

    const stored = mockPrisma.runStore.get(run.id);
    expect(stored.status).toBe(RUN_STATUS.ERROR);
    expect(stored.log.error).toBe('catastrophic');
  });
});
