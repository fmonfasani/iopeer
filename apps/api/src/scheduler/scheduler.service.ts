import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RunsService } from '../runs/runs.service';
import { GateService } from '../gates/gate.service';
import { PrismaClient, Prisma, RunStatus } from '@prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private planPath = this.resolvePlanPath();
  private plan: any;

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

  async start() {
    this.logger.log('Scheduler started');
  }

  async getSucceededRuns(limit = 10) {
    return this.prisma.run.findMany({
      where: { status: { equals: RunStatus.SUCCEEDED } },
      orderBy: { finishedAt: 'desc' },
      take: limit,
    });
  }

  private resolvePlanPath() {
    const candidates = [
      path.join(process.cwd(), 'plans', 'plan-bootstrap.json'),
      path.join(process.cwd(), 'apps/api/plans/plan-bootstrap.json'),
      path.join(__dirname, '..', 'plans', 'plan-bootstrap.json'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return candidates[0];
  }

  private loadPlan() {
    const raw = fs.readFileSync(this.planPath, 'utf8');
    this.plan = JSON.parse(raw);
  }

  async tick() {
    // 1) calcular qué acciones ya “SUCCEEDED” mirando logs (simple)
    const succeeded: Record<string, string> = {};
    const finished = await this.prisma.run.findMany({
      where: { status: { equals: RunStatus.SUCCEEDED } },
    });
  }
}
