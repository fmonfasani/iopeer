import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  it('tick enqueues workflow when gates succeed', async () => {
    const mockPrisma = createMockPrismaClient([
      {
        id: 'run-1',
        status: RUN_STATUS.SUCCESS,
        log: { meta: { actionId: 'other-action' } },
      },
    ]);
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
      firstAction.workflowId,
      firstAction.nodes,
      {
        actionId: firstAction.id,
        level: firstAction.level,
      },
    );
  });
});
