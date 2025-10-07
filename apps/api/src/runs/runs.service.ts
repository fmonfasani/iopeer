import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { StepsRegistry, type StepContext } from '../steps/registry';

export type StepNode = { id?: string; type: string; params?: Record<string, any> };

export type EnqueueRunDto = {
  workflowId: string;
  nodes: StepNode[];
  meta?: Record<string, any>;
  requestId?: string;
};

const MAX_ATTEMPTS_DEFAULT = 3;
const RETRY_DELAY_MS = 150;

import { RUN_STATUS } from './run-status';

type QueueItem = {
  runId: string;
  workflowId: string;
  nodes: StepNode[];
  meta?: Record<string, any>;
  attempt: number;
  requestId?: string;
};

type StepLogEntry = {
  id: string;
  status: 'OK' | 'ERROR';
  output?: unknown;
  error?: string;
  durationMs: number;
};

export type RunStats = {
  runs_total: number;
  runs_success: number;
  runs_error: number;
  step_duration_ms_p95: number;
  error_rate: number;
};

export type RunWithLog = {
  id: string;
  workflowId: string;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  meta: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  log?: { meta?: Record<string, any> | null; [key: string]: any } | null;
  error?: string | null;
  errorMessage?: string | null;
  durationMs?: number | null;
};

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);
  private readonly queue: QueueItem[] = [];
  private processing = false;
  private readonly stepDurations: number[] = [];
  private readonly stats = { total: 0, success: 0, error: 0 };

  constructor(
    private readonly prisma: PrismaService,
    private readonly steps: StepsRegistry,
  ) {}

  async createRun(
    workflowId: string,
    nodes: StepNode[],
    meta?: Record<string, any>,
    requestId?: string,
  ) {
    if (!workflowId) {
      throw new Error('workflowId is required');
    }

    const runLog = {
      meta: meta ?? undefined,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS_DEFAULT,
      stepLogs: [] as StepLogEntry[],
    };

    const run = (await this.prisma.run.create({
      data: {
        workflowId,
        status: RUN_STATUS.PENDING,
        log: runLog as any,
      } as any,
    })) as RunWithLog;

    this.queue.push({
      runId: run.id,
      workflowId,
      nodes,
      meta,
      attempt: 0,
      requestId: requestId ?? randomUUID(),
    });

    void this.processNext();
    return { ...run, log: runLog } as RunWithLog;
  }

  async enqueueRun(dto: EnqueueRunDto) {
    const run = await this.createRun(dto.workflowId, dto.nodes, dto.meta, dto.requestId);
    return run.id;
  }

  async getRun(id: string): Promise<RunWithLog | null> {
    return (await this.prisma.run.findUnique({ where: { id } })) as RunWithLog | null;
  }

  async listRecentRuns(limit = 50) {
    return (await this.prisma.run.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })) as RunWithLog[];
  }

  getStats(): RunStats {
    const { total, success, error } = this.stats;
    const errorRate = total === 0 ? 0 : error / total;
    return {
      runs_total: total,
      runs_success: success,
      runs_error: error,
      step_duration_ms_p95: this.percentile(this.stepDurations, 95),
      error_rate: errorRate,
    };
  }

  async processNext(): Promise<void> {
    if (this.processing) return;

    const job = this.queue.shift();
    if (!job) return;

    this.processing = true;

    const stepLogs: StepLogEntry[] = [];
    let startedAt = new Date();

    try {
      const run = (await this.prisma.run.findUnique({ where: { id: job.runId } })) as RunWithLog | null;
      if (!run) {
        return;
      }

      const log = this.normaliseLog(run.log as any);
      if (typeof log.attempts !== 'number') {
        log.attempts = job.attempt;
      }
      log.meta = job.meta ?? log.meta;

      startedAt = run.startedAt ?? new Date();

      await this.prisma.run.update({
        where: { id: job.runId },
        data: {
          status: RUN_STATUS.RUNNING,
          startedAt,
          log: log as any,
          errorMessage: null,
        },
      } as any);

      let previousOutput: unknown;
      for (const node of job.nodes) {
        const step = this.steps.get(node.type);
        const stepStart = Date.now();
        const context: StepContext = {
          requestId: job.requestId!,
          runId: job.runId,
          previousOutput,
          step: { id: node.id ?? node.type, type: node.type, params: node.params },
        };

        const args: any[] = [node.params ?? {}];
        if (step.run.length >= 2) {
          args.push(context);
        }

        try {
          const output = await (step.run as any)(...args);
          const durationMs = Date.now() - stepStart;
          previousOutput = output;
          this.recordStepDuration(durationMs);
          stepLogs.push({
            id: node.id ?? node.type,
            status: 'OK',
            output,
            durationMs,
          });
        } catch (error: any) {
          const durationMs = Date.now() - stepStart;
          this.recordStepDuration(durationMs);
          stepLogs.push({
            id: node.id ?? node.type,
            status: 'ERROR',
            error: error?.message ?? String(error),
            durationMs,
          });
          throw error;
        }
      }

      const finishedAt = new Date();
      const durationMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());
      const updatedLog = {
        ...log,
        attempts: job.attempt,
        stepLogs,
      } as Record<string, unknown>;
      delete updatedLog.error;

      await this.prisma.run.update({
        where: { id: job.runId },
        data: {
          status: RUN_STATUS.SUCCESS,
          finishedAt,
          durationMs,
          errorMessage: null,
          log: updatedLog as any,
        },
      } as any);

      this.stats.total += 1;
      this.stats.success += 1;
    } catch (error) {
      await this.handleRunFailure(job, error, stepLogs, startedAt);
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setImmediate(() => void this.processNext());
      }
    }
  }

  async handleRunFailure(job: QueueItem, cause: unknown, stepLogs: StepLogEntry[] = [], startedAt?: Date) {
    const run = (await this.prisma.run.findUnique({ where: { id: job.runId } })) as RunWithLog | null;
    if (!run) {
      return;
    }

    const log = this.normaliseLog(run.log as any);
    const attempts = log.attempts ?? job.attempt;
    const maxAttempts = log.maxAttempts ?? MAX_ATTEMPTS_DEFAULT;
    const errorMessage = cause instanceof Error ? cause.message : String(cause);

    const nextAttempts = attempts + 1;
    log.attempts = nextAttempts;
    log.error = errorMessage;
    if (stepLogs.length > 0) {
      log.stepLogs = stepLogs;
    }

    if (nextAttempts < maxAttempts) {
      const nextAttemptAt = new Date(Date.now() + RETRY_DELAY_MS);
      log.nextAttemptAt = nextAttemptAt.toISOString();

      await this.prisma.run.update({
        where: { id: job.runId },
        data: {
          status: RUN_STATUS.PENDING,
          log: log as any,
          errorMessage,
        },
      } as any);

      setTimeout(() => {
        this.queue.push({ ...job, attempt: nextAttempts });
        void this.processNext();
      }, RETRY_DELAY_MS);
    } else {
      const finishedAt = new Date();
      const started = startedAt ?? run.startedAt ?? new Date(finishedAt.getTime());
      const durationMs = Math.max(0, finishedAt.getTime() - started.getTime());

      await this.prisma.run.update({
        where: { id: job.runId },
        data: {
          status: RUN_STATUS.ERROR,
          finishedAt,
          durationMs,
          errorMessage,
          log: log as any,
        },
      } as any);

      this.stats.total += 1;
      this.stats.error += 1;
    }
  }

  private normaliseLog(raw: any) {
    const base = raw && typeof raw === 'object' ? { ...raw } : {};
    if (!Array.isArray(base.stepLogs)) {
      base.stepLogs = [];
    }
    base.attempts = typeof base.attempts === 'number' ? base.attempts : 0;
    base.maxAttempts = typeof base.maxAttempts === 'number' ? base.maxAttempts : MAX_ATTEMPTS_DEFAULT;
    return base;
  }

  private recordStepDuration(durationMs: number) {
    this.stepDurations.push(durationMs);
    if (this.stepDurations.length > 1_000) {
      this.stepDurations.splice(0, this.stepDurations.length - 1_000);
    }
  }

  private percentile(values: number[], p: number) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[index];
  }
}
