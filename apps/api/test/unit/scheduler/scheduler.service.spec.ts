import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it, vi } from 'vitest';
import { GateService } from '../../../src/gates/gate.service';
import { RunsService } from '../../../src/runs/runs.service';
import { SchedulerService } from '../../../src/scheduler/scheduler.service';
import { RUN_STATUS } from '../../../src/runs/run-status';
import { createMockPrismaClient } from '../../factories';

describe('SchedulerService', () => {
  const planCandidates = [
    path.resolve(process.cwd(), 'plans/plan-bootstrap.json'),
    path.resolve(process.cwd(), 'apps/api/plans/plan-bootstrap.json'),
  ];
  const planPath = planCandidates.find((candidate) => fs.existsSync(candidate)) ?? planCandidates[1];
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const firstAction = plan.schedule[0];

  it('start logs scheduler started', async () => {
    const mockPrisma = createMockPrismaClient();
    const runs = { createRun: vi.fn() } as unknown as RunsService;
    const gates = {
      checkEnv: vi.fn().mockResolvedValue(true),
      checkDbReachable: vi.fn().mockResolvedValue(true),
      checkDepsSucceeded: vi.fn().mockResolvedValue(true),
    } as unknown as GateService;

    const loggerSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const service = new SchedulerService(runs, gates, mockPrisma.client);

    await service.start();
    expect(loggerSpy).toHaveBeenCalledWith('Scheduler started');
  });

  it('getSucceededRuns filters by succeeded status', async () => {
    const mockPrisma = createMockPrismaClient();
    const service = new SchedulerService(
      { createRun: vi.fn() } as unknown as RunsService,
      {
        checkEnv: vi.fn(),
        checkDbReachable: vi.fn(),
        checkDepsSucceeded: vi.fn(),
      } as unknown as GateService,
      mockPrisma.client,
    );

    await service.getSucceededRuns(5);
    expect(mockPrisma.client.run.findMany).toHaveBeenCalledWith({
      where: { status: { equals: RUN_STATUS.SUCCESS } },
      orderBy: { finishedAt: 'desc' },
      take: 5,
    });
  });

  it('getSucceededRuns retries without errorMessage column when missing', async () => {
    const knownError = new PrismaClientKnownRequestError('Column does not exist', {
      code: 'P2022',
      clientVersion: '6.16.3',
      meta: { column: 'Run.errorMessage' },
    });

    const fallbackRun = {
      id: 'run-1',
      workflowId: 'wf',
      status: RUN_STATUS.SUCCESS,
      startedAt: new Date(),
      finishedAt: new Date(),
      meta: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      log: { meta: { actionId: 'action-1' } },
      error: 'boom',
      durationMs: 100,
    };

    const mockPrisma = createMockPrismaClient();
    const findMany = vi
      .fn()
      .mockRejectedValueOnce(knownError)
      .mockResolvedValueOnce([fallbackRun]);

    mockPrisma.client.run.findMany = findMany as any;

    const service = new SchedulerService(
      { createRun: vi.fn() } as unknown as RunsService,
      {
        checkEnv: vi.fn(),
        checkDbReachable: vi.fn(),
        checkDepsSucceeded: vi.fn(),
      } as unknown as GateService,
      mockPrisma.client,
    );

    const runs = await service.getSucceededRuns(2);

    expect(findMany).toHaveBeenNthCalledWith(1, {
      where: { status: { equals: RUN_STATUS.SUCCESS } },
      orderBy: { finishedAt: 'desc' },
      take: 2,
    });

    expect(findMany).toHaveBeenNthCalledWith(2, {
      where: { status: { equals: RUN_STATUS.SUCCESS } },
      orderBy: { finishedAt: 'desc' },
      take: 2,
      select: {
        id: true,
        workflowId: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        meta: true,
        createdAt: true,
        updatedAt: true,
        log: true,
        error: true,
        durationMs: true,
      },
    });

    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      id: 'run-1',
      errorMessage: 'boom',
    });
  });

  it('tick enqueues workflow when gates succeed', async () => {
    const workflow = { id: 'wf-existing', key: firstAction.workflowId, name: 'Bootstrap' };
    const mockPrisma = createMockPrismaClient([
      {
        id: 'run-1',
        status: RUN_STATUS.SUCCESS,
        log: { meta: { actionId: 'other-action' } },
      },
    ], [workflow]);
    const runs = { createRun: vi.fn().mockResolvedValue(undefined) } as unknown as RunsService;
    const gates = {
      checkEnv: vi.fn().mockResolvedValue(true),
      checkDbReachable: vi.fn().mockResolvedValue(true),
      checkDepsSucceeded: vi.fn().mockResolvedValue(true),
    } as unknown as GateService;

    const service = new SchedulerService(runs, gates, mockPrisma.client);
    const result = await service.tick();

    expect(result).toEqual({ ok: true });
    expect(runs.createRun).toHaveBeenCalledWith(
      workflow.id,
      firstAction.nodes,
      {
        actionId: firstAction.id,
        level: firstAction.level,
      },
    );
  });
});
