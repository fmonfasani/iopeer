import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { StepsRegistry } from '../steps/registry';

type StepNode = { id: string; type: string; params?: any };
type QueueItem = {
  runId: string;
  workflowId: string;
  nodes: StepNode[];
  meta?: any;
};

const toDbStatus = (s: string) =>
  s === 'QUEUED' ? 'PENDING' : s === 'SUCCEEDED' ? 'SUCCESS' : s; // RUNNING / FAILED / CANCELLED pasan tal cual

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);
  private readonly prisma = new PrismaClient();

  // Cola simple en memoria
  private queue: QueueItem[] = [];
  private processing = false;

  constructor(private readonly steps: StepsRegistry) {}

  async createRun(
    workflowId: string,
    nodes: StepNode[],
    meta?: Record<string, any>,
  ) {
    const run = await this.prisma.run.create({
      data: {
        workflowId,
        // ✅ enum actualizado
        status: 'QUEUED' as any,
        log: { meta } as any,
      },
    });

    this.queue.push({ runId: run.id, workflowId, nodes, meta });
    // procesar en background
    this.processNext().catch((e) => this.logger.error(e?.stack || e));
    return run;
  }

  async getRun(id: string) {
    return this.prisma.run.findUnique({ where: { id } });
  }

  // requerido por RunsController
  async listRecentRuns(limit = 50) {
    return this.prisma.run.findMany({
      // si no tenés createdAt, ordenamos por startedAt y luego id
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const job = this.queue.shift()!;
    try {
      // ✅ RUNNING
      await this.prisma.run.update({
        where: { id: job.runId },
        data: { status: 'RUNNING' as any, startedAt: new Date() },
      });

      const stepLogs: any[] = [];

      for (const node of job.nodes) {
        const step = this.steps.get(node.type);
        if (!step) throw new Error(`Step not found: ${node.type}`);

        const out = await step.run(node.params ?? {});
        stepLogs.push({ id: node.id, type: node.type, output: out });

        // persistir log incremental (opcional)
        await this.prisma.run.update({
          where: { id: job.runId },
          data: { log: { stepLogs } as any },
        });
      }

      // ✅ SUCCEEDED
      await this.prisma.run.update({
        where: { id: job.runId },
        data: { status: 'SUCCEEDED' as any, finishedAt: new Date() },
      });
    } catch (err: any) {
      // ✅ FAILED
      await this.prisma.run.update({
        where: { id: job.runId },
        data: {
          status: 'FAILED' as any,
          finishedAt: new Date(),
          log: { error: String(err?.message ?? err) } as any,
        },
      });
      throw err;
    } finally {
      this.processing = false;
      // encadenar el siguiente
      this.processNext().catch(() => {});
    }
  }
}
