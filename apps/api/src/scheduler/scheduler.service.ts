import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import * as path from 'path';

import { PrismaService } from '../prisma/prisma.service';
import type { GateService } from '../gates/gate.service';
import type { RunWithLog, RunsService } from '../runs/runs.service';
import { RUN_STATUS } from '../runs/run-status';

const DEFAULT_INTERVAL_MS = 60_000;

function resolvePlanCandidates() {
  return [
    path.resolve(process.cwd(), 'plans/plan-bootstrap.json'),
    path.resolve(process.cwd(), 'apps/api/plans/plan-bootstrap.json'),
    path.resolve(__dirname, '../plans/plan-bootstrap.json'),
  ];
}

type RunsLike = Partial<
  Pick<RunsService, 'enqueueRun' | 'createRun'>
>;

type GateLike = Partial<
  Pick<GateService, 'checkEnv' | 'checkDbReachable' | 'checkDepsSucceeded'>
>;

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly planPromise: Promise<void>;
  private plan: any = null;
  private timer?: NodeJS.Timeout;
  private readonly runs: RunsLike;
  private readonly gates?: GateLike;
  private readonly prisma?: PrismaClient;

  constructor(
    runsService: RunsService,
    @Optional() gateService?: GateService,
    @Optional() prismaService?: PrismaService,
  ) {
    this.runs = runsService;
    this.gates = gateService;
    this.prisma = prismaService;
    this.planPromise = this.loadPlan();
  }

  async onModuleInit() {
    void this.start();
  }

  async onModuleDestroy() {
    this.stop();
  }

  async start(intervalMs = DEFAULT_INTERVAL_MS) {
    if (this.timer) return;
    this.logger.log('Scheduler started');
    this.timer = setInterval(() => {
      this.tick().catch((err) => this.logger.error('scheduler:tick:error', err));
    }, intervalMs);
    await this.planPromise;
    await this.tick();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async tick() {
    await this.planPromise;
    if (!this.plan?.schedule) {
      return { ok: true };
    }

    if (this.gates && this.prisma && typeof this.runs.createRun === 'function') {
      return this.tickWithGates();
    }

    return this.tickSimple();
  }

  async getSucceededRuns(limit: number): Promise<RunWithLog[]> {
    if (!this.prisma) {
      return [];
    }
    return (await this.prisma.run.findMany({
      where: { status: { equals: RUN_STATUS.SUCCESS } },
      orderBy: { finishedAt: 'desc' },
      take: limit,
    })) as RunWithLog[];
  }

  private async tickSimple() {
    const enqueue = this.runs.enqueueRun;
    if (typeof enqueue !== 'function') {
      return { ok: true };
    }

    for (const action of this.plan.schedule) {
      await enqueue.call(this.runs, {
        workflowId: action.workflowId,
        nodes: action.nodes,
        meta: { actionId: action.id, level: action.level },
        requestId: `scheduler-${Date.now()}`,
      });
    }

    return { ok: true };
  }

  private async tickWithGates() {
    const firstAction = this.plan.schedule[0];
    if (!firstAction) {
      return { ok: true };
    }

    const [envOk, dbOk] = await Promise.all([
      this.gates!.checkEnv?.(firstAction.requiredEnv ?? []) ?? Promise.resolve(true),
      this.gates!.checkDbReachable?.() ?? Promise.resolve(true),
    ]);

    if (!envOk || !dbOk) {
      return { ok: false };
    }

    const succeeded = await this.getSucceededRuns(10);
    const deps: Record<string, string> = succeeded.reduce((acc, run) => {
      const actionId = run?.log?.meta?.actionId;
      if (actionId) {
        acc[actionId] = RUN_STATUS.SUCCESS;
      }
      return acc;
    }, {} as Record<string, string>);

    const depsOk = await (this.gates!.checkDepsSucceeded?.(deps) ?? Promise.resolve(true));
    if (!depsOk) {
      return { ok: false };
    }

    await (this.runs.createRun as Function).call(
      this.runs,
      firstAction.workflowId,
      firstAction.nodes,
      { actionId: firstAction.id, level: firstAction.level },
    );

    return { ok: true };
  }

  private async loadPlan() {
    const candidates = resolvePlanCandidates();
    for (const candidate of candidates) {
      try {
        const contents = await readFile(candidate, 'utf8');
        this.plan = JSON.parse(contents);
        return;
      } catch {
        // try next candidate
      }
    }

    this.plan = null;
  }
}
