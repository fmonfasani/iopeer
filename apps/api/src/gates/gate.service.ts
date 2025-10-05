import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class GateService {
  constructor(private prisma: PrismaClient) {}

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

  async checkDepsSucceeded(
    depResults: Record<string, string>,
  ): Promise<boolean> {
    // depResults: { "L1-HEALTH": "SUCCEEDED", ... } — simplificado (lee de runs/log)
    return Object.values(depResults).every((s) => s === 'SUCCEEDED');
  }
}
