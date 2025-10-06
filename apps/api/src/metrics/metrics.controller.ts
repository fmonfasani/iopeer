// src/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RunStatus } from '@prisma/client';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get() {
    const [pending, running, success, failed, cancelled] = await Promise.all([
      this.prisma.run.count({ where: { status: RunStatus.PENDING } }),
      this.prisma.run.count({ where: { status: RunStatus.RUNNING } }),
      this.prisma.run.count({ where: { status: RunStatus.SUCCESS } }),
      this.prisma.run.count({ where: { status: RunStatus.ERROR } }),
      this.prisma.run.count({ where: { status: RunStatus.CANCELLED } }),
    ]);

    return { pending, running, success, failed, cancelled };
  }
}
