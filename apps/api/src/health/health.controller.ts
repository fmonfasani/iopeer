import { Controller, Get } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaClient) {}

  @Get()
  async get() {
    let db: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      db = 'down';
    }

    return { ok: true, ts: new Date().toISOString(), db };
  }
}
