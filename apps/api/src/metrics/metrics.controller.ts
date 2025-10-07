import { Controller, Get, Logger, Optional } from '@nestjs/common';

import type { PrismaService } from '../prisma/prisma.service';
import type { RunsService } from '../runs/runs.service';
import { RUN_STATUS } from '../runs/run-status';

type PrismaLike = Pick<PrismaService, 'run'>;
type RunsLike = Pick<RunsService, 'getStats'>;

function isPrismaLike(source: unknown): source is PrismaLike {
  return Boolean(source && typeof (source as PrismaLike).run?.count === 'function');
}

function isRunsLike(source: unknown): source is RunsLike {
  return Boolean(source && typeof (source as RunsLike).getStats === 'function');
}

@Controller('metrics')
export class MetricsController {
  private readonly startedAt = Date.now();
  private readonly logger = new Logger(MetricsController.name);

  constructor(
    @Optional() private readonly runsMaybe?: RunsService,
    @Optional() private readonly prismaMaybe?: PrismaService,
  ) {
    if (!this.runsMaybe && !this.prismaMaybe) {
      this.logger.warn('MetricsController initialised without RunsService or PrismaService');
    }
  }

  @Get()
  get() {
    const runs = this.resolveRunsService();
    return runs?.getStats() ?? {
      runs_total: 0,
      runs_success: 0,
      runs_error: 0,
      step_duration_ms_p95: 0,
      error_rate: 0,
    };
  }

  async getMetrics() {
    const prisma = this.resolvePrisma();
    if (!prisma) {
      const stats = this.resolveRunsService()?.getStats();
      return {
        runsTotal: stats?.runs_total ?? 0,
        runsFailed: stats?.runs_error ?? 0,
        errorRatePct:
          stats && stats.runs_total ? Math.round((stats.runs_error / stats.runs_total) * 100) : 0,
        uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
      };
    }

    const statusFailed = RUN_STATUS.ERROR;

    const [total, failed] = await Promise.all([
      prisma.run.count(),
      prisma.run.count({ where: { status: { equals: statusFailed } } }),
    ]);

    const succeeded = Math.max(0, total - failed);
    const errorRatePct = total === 0 ? 0 : Math.round((failed / total) * 100);

    return {
      runsTotal: total,
      runsFailed: failed,
      runsSucceeded: succeeded,
      errorRatePct,
      uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  private resolveRunsService(): RunsLike | undefined {
    if (isRunsLike(this.runsMaybe)) return this.runsMaybe;
    if (isRunsLike(this.prismaMaybe)) return this.prismaMaybe as unknown as RunsLike;
    return undefined;
  }

  private resolvePrisma(): PrismaLike | undefined {
    if (isPrismaLike(this.prismaMaybe)) return this.prismaMaybe;
    if (isPrismaLike(this.runsMaybe)) return this.runsMaybe as unknown as PrismaLike;
    return undefined;
  }
}
