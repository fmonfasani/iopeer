import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GateService {
  constructor(private prisma: PrismaService) {}

  async checkEnv(keys: string[]): Promise<boolean> {
    for (const k of keys) {
      if (!process.env[k]) return false;
    }
    return true;
  }

  async checkDbReachable(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`select 1`;
      return true;
    } catch {
      return false;
    }
  }

  async checkDepsSucceeded(depResults: Record<string, string>): Promise<boolean> {
    const successValues = new Set(['SUCCESS', 'SUCCEEDED']);
    return Object.values(depResults).every((status) => successValues.has(status));
  }
}
