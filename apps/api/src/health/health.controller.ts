import { Controller, Get, Optional } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';

type PrismaLike = Pick<PrismaService, '$queryRaw' | '$queryRawUnsafe'>;

@Controller('health')
export class HealthController {
  constructor(@Optional() private readonly prisma?: PrismaLike) {}

  ok() {
    return { ok: true, ts: new Date().toISOString() };
  }

  @Get()
  async get() {
    try {
      const query = this.prisma?.$queryRaw ?? this.prisma?.$queryRawUnsafe;
      if (query) {
        await query.call(this.prisma, 'SELECT 1;');
      }
      return { ok: true, db: 'up' };
    } catch {
      return { ok: true, db: 'down' };
    }
  }
}
