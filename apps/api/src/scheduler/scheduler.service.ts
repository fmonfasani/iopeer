import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { rootLogger } from '../logger/pino-logger.service';
import { RunsService } from '../runs/runs.service';

const PLAN_PATH = join(process.cwd(), 'apps', 'api', 'plans', 'plan-bootstrap.json');

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = rootLogger.child({ service: 'SchedulerService' });
  private timer?: NodeJS.Timeout;

  constructor(private readonly runsService: RunsService) {}

  onModuleInit() {
    const interval = Number(process.env.SCHEDULER_INTERVAL_MS ?? 60_000);
    this.logger.info({ interval }, 'scheduler:start');
    this.timer = setInterval(() => {
      this.tick().catch((error) =>
        this.logger.error({ err: error }, 'scheduler:tick:error'),
      );
    }, interval);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
      this.logger.info('scheduler:stop');
    }
  }

  async tick() {
    const raw = await readFile(PLAN_PATH, 'utf8');
    const plan = JSON.parse(raw);
    const schedule = Array.isArray(plan.schedule) ? plan.schedule : [];
    let dispatched = 0;

    for (const entry of schedule) {
      if (!entry?.workflowId || !Array.isArray(entry.nodes)) {
        continue;
      }

      await this.runsService.enqueueRun({
        workflowId: entry.workflowId,
        nodes: entry.nodes,
        meta: { planId: plan.plan ?? 'bootstrap', scheduleId: entry.id },
        requestId: `scheduler-${randomUUID()}`,
      });
      dispatched += 1;
    }

    this.logger.info({ runs: dispatched }, 'scheduler:tick');
  }
}
