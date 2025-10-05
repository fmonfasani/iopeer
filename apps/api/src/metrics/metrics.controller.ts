import { Controller, Get } from '@nestjs/common';
import { PrismaClient, Prisma, RunStatus } from '@prisma/client';

@Controller('metrics')
export class MetricsController {
  private prisma = new PrismaClient();

  @Get()
  async getMetrics() {
    const [runsTotal, runsFailed] = await Promise.all([
      this.prisma.run.count(),
      this.prisma.run.count({ where: { status: RunStatus.FAILED } }),
    ]);

    return { failed, running, succeeded, queued, cancelled };
  }
}
