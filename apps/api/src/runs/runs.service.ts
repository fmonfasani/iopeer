import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { StepsRegistry } from '../steps/registry';

type QueueItem = {
  runId: string;
  workflowId: string;
  nodes: any[];
  meta?: any;
};

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);
  private queue: QueueItem[] = [];
  private processing = false;

  constructor(
    private prisma: PrismaClient,
    private steps: StepsRegistry,
  ) {}

  async createRun(workflowId: string, nodes: any[], meta?: any) {
    const run = await this.prisma.run.create({
      data: {
        workflowId,
        status: Prisma.RunStatus.PENDING,
        log: { meta } as any,
      },
    });
    this.queue.push({ runId: run.id, workflowId, nodes, meta });
    this.processNext().catch((e) => this.logger.error(e));
    return run;
  }

  async getRun(id: string) {
    return this.prisma.run.findUnique({ where: { id } });
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const job = this.queue.shift()!;
    try {
      await this.prisma.run.update({
        where: { id: job.runId },
        data: { status: Prisma.RunStatus.RUNNING, startedAt: new Date() },
      });

      const stepLogs: any[] = [];
      for (const node of job.nodes) {
        const step = this.steps.get(node.type);
        const out = await step.run(node.params || {});
        stepLogs.push({ id: node.id, type: node.type, output: out });
        await this.prisma.run.update({
          where: { id: job.runId },
          data: { log: { stepLogs } as any },
        });
      }

      await this.prisma.run.update({
        where: { id: job.runId },
        data: { status: Prisma.RunStatus.SUCCESS, finishedAt: new Date() },
      });
    } catch (err: any) {
      await this.prisma.run.update({
        where: { id: job.runId },
        data: {
          status: Prisma.RunStatus.FAILED,
          finishedAt: new Date(),
          log: { error: String(err?.message ?? err) } as any,
        },
      });
    } finally {
      this.processing = false;
      this.processNext().catch(() => {});
    }
  }
}
