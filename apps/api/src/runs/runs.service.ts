import { Injectable } from '@nestjs/common';
import { PrismaClient, Run, RunStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

import { rootLogger } from '../logger/pino-logger.service';
import { StepsRegistry, Step, StepContext } from '../steps/registry';

type StepNode = { id: string; type: string; params?: Record<string, any> };

type EnqueueRunDto = {
  workflowId: string;
  nodes: StepNode[];
  meta?: Record<string, any>;
  requestId?: string;
};

type QueueItem = {
  runId: string;
  workflowId: string;
  nodes: StepNode[];
  requestId: string;
  meta?: Record<string, any>;
};

type RunStats = {
  runsTotal: number;
  runsSuccess: number;
  runsError: number;
  stepDurations: number[];
};

const STEP_DURATION_LIMIT = 1000;

@Injectable()
export class RunsService {
  private readonly logger = rootLogger.child({ service: 'RunsService' });
  private readonly queue: QueueItem[] = [];
  private processing = false;
  private readonly stats: RunStats = {
    runsTotal: 0,
    runsSuccess: 0,
    runsError: 0,
    stepDurations: [],
  };

  constructor(
    private readonly prisma: PrismaClient,
    private readonly stepsRegistry: StepsRegistry,
  ) {}

  async enqueueRun(dto: EnqueueRunDto): Promise<string> {
    if (!dto.workflowId) {
      throw new Error('workflowId is required');
    }
    if (!Array.isArray(dto.nodes) || dto.nodes.length === 0) {
      throw new Error('nodes must be a non-empty array');
    }

    const spec = { workflowId: dto.workflowId, nodes: dto.nodes };

    const run = await this.prisma.run.create({
      data: {
        workflowId: dto.workflowId,
        status: RunStatus.PENDING,
        log: dto.meta ? ({ meta: dto.meta } as any) : undefined,
        spec: spec as any,
      },
    });

    const requestId = dto.requestId ?? randomUUID();
    this.queue.push({
      runId: run.id,
      workflowId: dto.workflowId,
      nodes: dto.nodes,
      requestId,
      meta: dto.meta,
    });

    this.logger.info({ runId: run.id, requestId }, 'run:enqueue');

    void this.drainQueue();

    return run.id;
  }

  async getRun(id: string): Promise<Run | null> {
    return this.prisma.run.findUnique({ where: { id } });
  }

  async listRecentRuns(limit = 50) {
    return this.prisma.run.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
    });
  }

  getStats() {
    const { runsTotal, runsSuccess, runsError, stepDurations } = this.stats;
    const p95 = stepDurations.length ? percentile(stepDurations, 95) : 0;
    const errorRate = runsTotal === 0 ? 0 : runsError / runsTotal;
    return {
      runs_total: runsTotal,
      runs_success: runsSuccess,
      runs_error: runsError,
      step_duration_ms_p95: p95,
      error_rate: errorRate,
    };
  }

  private async drainQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      await this.executeRun(item).catch((error) => {
        this.logger.error({
          err: error,
          runId: item.runId,
          requestId: item.requestId,
        });
      });
    }

    this.processing = false;
  }

  private async executeRun(item: QueueItem) {
    const runLogger = this.logger.child({
      runId: item.runId,
      requestId: item.requestId,
    });
    runLogger.info({ workflowId: item.workflowId }, 'run:start');

    const startedAt = new Date();
    await this.prisma.run.update({
      where: { id: item.runId },
      data: { status: RunStatus.RUNNING, startedAt },
    });

    const stepLogs: Array<Record<string, any>> = [];
    let lastOutput: unknown;

    try {
      for (const stepNode of item.nodes) {
        const step: Step = this.stepsRegistry.get(stepNode.type);
        const stepLogger = runLogger.child({
          stepId: stepNode.id,
          stepType: stepNode.type,
        });
        stepLogger.info('step:start');

        const started = Date.now();
        const context: StepContext = {
          requestId: item.requestId,
          runId: item.runId,
          previousOutput: lastOutput,
          step: stepNode,
        };

        try {
          const output = await step.run(stepNode.params ?? {}, context);
          const durationMs = Date.now() - started;
          lastOutput = output;
          this.recordStepDuration(durationMs);
          const logEntry = {
            id: stepNode.id,
            type: stepNode.type,
            status: 'SUCCESS',
            durationMs,
            output,
          };
          stepLogs.push(logEntry);
          stepLogger.info({ durationMs }, 'step:finish');
        } catch (error: any) {
          const durationMs = Date.now() - started;
          this.recordStepDuration(durationMs);
          const message = error?.message ?? String(error);
          const logEntry = {
            id: stepNode.id,
            type: stepNode.type,
            status: 'ERROR',
            durationMs,
            error: message,
          };
          stepLogs.push(logEntry);
          stepLogger.error({ durationMs, err: error }, 'step:error');
          throw error;
        }
      }

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();
      await this.prisma.run.update({
        where: { id: item.runId },
        data: {
          status: RunStatus.SUCCESS,
          finishedAt,
          durationMs,
          log: { steps: stepLogs } as any,
        },
      });

      this.stats.runsTotal += 1;
      this.stats.runsSuccess += 1;

      runLogger.info({ durationMs }, 'run:success');
    } catch (error: any) {
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();
      const message = error?.message ?? String(error);

      await this.prisma.run.update({
        where: { id: item.runId },
        data: {
          status: RunStatus.ERROR,
          finishedAt,
          durationMs,
          errorMessage: message,
          log: { steps: stepLogs } as any,
        },
      });

      this.stats.runsTotal += 1;
      this.stats.runsError += 1;

      runLogger.error({ durationMs, err: error }, 'run:error');
    }
  }

  private recordStepDuration(durationMs: number) {
    this.stats.stepDurations.push(durationMs);
    if (this.stats.stepDurations.length > STEP_DURATION_LIMIT) {
      this.stats.stepDurations.splice(
        0,
        this.stats.stepDurations.length - STEP_DURATION_LIMIT,
      );
    }
  }

  private async handleRunFailure(job: QueueItem, error: any) {
    const run = await this.prisma.run.findUnique({ where: { id: job.runId } });
    if (!run) {
      return;
    }

    const currentLog: RunLog = {
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      nextAttemptAt: null,
      stepLogs: [],
      ...(run.log as RunLog | null),
    };
    currentLog.meta = currentLog.meta ?? {};
    currentLog.stepLogs = Array.isArray(currentLog.stepLogs)
      ? currentLog.stepLogs
      : [];

    const attempts = (currentLog.attempts ?? 0) + 1;
    const maxAttempts = currentLog.maxAttempts ?? MAX_ATTEMPTS;
    currentLog.attempts = attempts;
    currentLog.maxAttempts = maxAttempts;
    currentLog.error = error?.message ?? String(error);

    if (attempts < maxAttempts) {
      const delay = BASE_BACKOFF_MS * Math.pow(2, attempts);
      const nextAttemptAt = new Date(Date.now() + delay);
      currentLog.nextAttemptAt = nextAttemptAt.toISOString();

      await this.prisma.run.update({
        where: { id: job.runId },
        data: {
          status: RunStatus.QUEUED,
          log: currentLog as any,
        },
      });

      this.logger.warn(
        `Run ${job.runId} failed (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms`,
      );

      this.enqueue(
        {
          ...job,
          attempt: attempts,
        },
        delay,
      );
      return;
    }

    currentLog.nextAttemptAt = null;

    await this.prisma.run.update({
      where: { id: job.runId },
      data: {
        status: RunStatus.FAILED,
        finishedAt: new Date(),
        log: currentLog as any,
      },
    });

    this.logger.error(
      `Run ${job.runId} failed permanently after ${attempts} attempts: ${currentLog.error}`,
    );
  }
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}
