import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly prisma = new PrismaClient();

  // llamado desde main.ts / scheduler.controller.ts
  async tick() {
    // últimos SUCCEEDED
    const recent = await this.prisma.run.findMany({
      where: { status: { equals: 'SUCCEEDED' as any } }, // ✅ enum actualizado
      orderBy: { finishedAt: 'desc' },
      take: 5,
    });
    this.logger.log(`tick: ${recent.length} runs SUCCEEDED recientes`);
    return { ok: true, recent };
  }

  // Stub
  start(): void {
    this.logger.log('Scheduler started (stub)');
  }

  async getSucceededRuns() {
    return this.prisma.run.findMany({
      where: { status: { equals: 'SUCCEEDED' as any } }, // ✅
      orderBy: { finishedAt: 'desc' },
      take: 20,
    });
  }
}
