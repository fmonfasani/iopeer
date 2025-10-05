// apps/api/src/runs/runs.service.ts
@Injectable()
export class RunsService {
  private queue: { runId: string }[] = [];
  private processing = false;
  constructor(private prisma: PrismaService, private steps: StepsRegistry) {}

  async create(dto: { workflowId: string; payload?: any }) {
    const run = await this.prisma.run.create({
      data: { workflowId: dto.workflowId, status: 'QUEUED', log: {} },
    });
    this.queue.push({ runId: run.id });
    this.processNext();
    return run;
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    const job = this.queue.shift()!;
    try {
      await this.prisma.run.update({ where: { id: job.runId }, data: { status: 'RUNNING', startedAt: new Date() } });
      // cargar workflow, ejecutar topológicamente nodos con this.steps.run(node)
      // agregar logs por paso
      await this.prisma.run.update({ where: { id: job.runId }, data: { status: 'SUCCEEDED', finishedAt: new Date() } });
    } catch (e) {
      // retry/backoff si corresponde
      await this.prisma.run.update({ where: { id: job.runId }, data: { status: 'FAILED', finishedAt: new Date(), log: { error: String(e) } } });
    } finally {
      this.processing = false;
      this.processNext();
    }
  }
}
