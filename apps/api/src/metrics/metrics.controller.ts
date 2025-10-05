import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Controller('metrics')
export class MetricsController {
  private prisma = new PrismaClient();

  @Get()
  async get() {
    const [failed, running, succeeded, queued, cancelled] = await Promise.all([
      this.prisma.run.count({ where: { status: 'FAILED' as any } }),
      this.prisma.run.count({ where: { status: 'RUNNING' as any } }),
      this.prisma.run.count({ where: { status: 'SUCCEEDED' as any } }), // ✅
      this.prisma.run.count({ where: { status: 'QUEUED' as any } }), // ✅
      this.prisma.run.count({ where: { status: 'CANCELLED' as any } }),
    ]);

    return { failed, running, succeeded, queued, cancelled };
  }
}
