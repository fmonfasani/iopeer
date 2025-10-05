import { Controller, Get } from '@nestjs/common';
import { PrismaClient, Prisma, RunStatus } from '@prisma/client';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly prisma: PrismaClient) {}

  @Get()
  async getMetrics() {
    const [runsTotal, runsFailed] = await Promise.all([
      this.prisma.run.count(),
      this.prisma.run.count({ where: { status: RunStatus.FAILED } }),
    ]);

    const uptimeSec = Math.floor(process.uptime());
    const errorRatePct = runsTotal > 0 ? (runsFailed / runsTotal) * 100 : 0;

    return {
      uptimeSec,
      runsTotal,
      runsFailed,
      p95Ms: null, // TODO: capture latency percentiles once metrics pipeline is ready
      p99Ms: null, // TODO: capture latency percentiles once metrics pipeline is ready
      errorRatePct,
    };
  }
}
