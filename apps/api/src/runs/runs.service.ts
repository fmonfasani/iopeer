import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { StepsRegistry } from '../steps/registry';

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 2_000;

type QueueItem = {
  runId: string;
  workflowId: string;
  nodes: any[];
  meta?: Record<string, any>;
  attempt: number;
};

type RunLog = {
  meta?: Record<string, any>;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string | null;
  stepLogs: Array<{
    id: string;
    type: string;
    startedAt: string;
    finishedAt?: string;
    durationMs?: number;
    status: 'OK' | 'ERROR';
    output?: unknown;
    error?: string;
  }>;
  error?: string;
};

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);
  private queue: QueueItem[] = [];
  private processing = false;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly steps: StepsRegistry,
  ) {}

  async createRun(workflowId: string, nodes: any[], meta?: any) {
    const log: RunLog = {
      meta: meta ? { ...meta } : {},
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      nextAttemptAt: null,
      stepLogs: [],
    };

    const run = await this.prisma.run.create({
      data: {
        workflowId,
        status: Prisma.RunStatus.QUEUED,
        log: log as any,
      },
    });

    this.enqueue({
      runId: run.id,
      workflowId,
      nodes,
      meta,
      attempt: 0,
    });

    return run;
  }

  async getRun(id: string) {
    return this.prisma.run.findUnique({ where: { id } });
  }

  async listRecentRuns(limit = 50) {
    return this.prisma.run.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  private enqueue(job: QueueItem, delayMs = 0) {
    if (delayMs > 0) {
      setTimeout(() => {
        this.queue.push(job);
        this.processNext().catch((error) => this.logger.error(error));
      }, delayMs);
      return;
    }

    this.queue.push(job);
    this.processNext().catch((error) => this.logger.error(error));
  }

  private async processNext(): Promise<void> {
    if (this.processing) {
      return;
    }

    const job = this.queue.shift();
    if (!job) {
      return;
    }

    this.processing = true;

    try {
      const run = await this.prisma.run.findUnique({ where: { id: job.runId } });
      if (!run) {
        return;
      }

      const previousLog = ((run.log as RunLog | null) ?? {
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
        nextAttemptAt: null,
        stepLogs: [],
      }) as RunLog;

      const stepLogs = Array.isArray(previousLog.stepLogs)
        ? [...previousLog.stepLogs]
        : [];

      const currentLog: RunLog = {
        ...previousLog,
        meta: {
          ...(previousLog.meta ?? {}),
          ...(job.meta ?? {}),
        },
        attempts: previousLog.attempts ?? 0,
        maxAttempts: previousLog.maxAttempts ?? MAX_ATTEMPTS,
        nextAttemptAt: null,
        stepLogs,
      };
      if ('error' in currentLog) {
        delete (currentLog as Partial<RunLog>).error;
      }

      const startedAt = run.startedAt ?? new Date();

      await this.prisma.run.update({
        where: { id: job.runId },
        data: {
          status: Prisma.RunStatus.RUNNING,
          startedAt,
          log: currentLog as any,
        },
      });

      for (const node of job.nodes) {
        const step = this.steps.get(node.type);
        const stepStart = new Date();
        const stepLogBase = {
          id: String(node.id ?? node.type),
          type: String(node.type),
          startedAt: stepStart.toISOString(),
        };

        try {
          const output = await step.run(node.params ?? {});
          const finishedAt = new Date();
          const entry = {
            ...stepLogBase,
            finishedAt: finishedAt.toISOString(),
            durationMs: finishedAt.getTime() - stepStart.getTime(),
            status: 'OK' as const,
            ...(output !== undefined ? { output } : {}),
          };
          currentLog.stepLogs = [...currentLog.stepLogs, entry];
          await this.prisma.run.update({
            where: { id: job.runId },
            data: {
              log: currentLog as any,
            },
          });
        } catch (stepError: any) {
          const finishedAt = new Date();
          const entry = {
            ...stepLogBase,
            finishedAt: finishedAt.toISOString(),
            durationMs: finishedAt.getTime() - stepStart.getTime(),
            status: 'ERROR' as const,
            error: stepError?.message ?? String(stepError),
          };
          currentLog.stepLogs = [...currentLog.stepLogs, entry];
          currentLog.error = stepError?.message ?? String(stepError);

          await this.prisma.run.update({
            where: { id: job.runId },
            data: {
              log: currentLog as any,
            },
          });

          throw stepError;
        }
      }

     await this.prisma.run.update({
        where: { id: job.runId },
        data: {
          status: Prisma.RunStatus.SUCCEEDED,
          finishedAt: new Date(),
          log: currentLog as any,
        },
      });
    } catch (error: any) {
      await this.handleRunFailure(job, error);
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        this.processNext().catch((err) => this.logger.error(err));
      }
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
          status: Prisma.RunStatus.QUEUED,
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
        status: Prisma.RunStatus.FAILED,
        finishedAt: new Date(),
        log: currentLog as any,
      },
    });

    this.logger.error(
      `Run ${job.runId} failed permanently after ${attempts} attempts: ${currentLog.error}`,
    );
  }
}
