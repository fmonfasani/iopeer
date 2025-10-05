import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RunsService } from '../runs/runs.service';
import { GateService } from '../gates/gate.service';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private planPath = path.join(
    process.cwd(),
    'apps',
    'api',
    'plans',
    'plan-bootstrap.json',
  );
  private plan: any;

  constructor(
    private runs: RunsService,
    private gates: GateService,
    private prisma: PrismaClient,
  ) {
    this.loadPlan();
  }

  private loadPlan() {
    const raw = fs.readFileSync(this.planPath, 'utf8');
    this.plan = JSON.parse(raw);
  }

  async tick() {
    // 1) calcular qué acciones ya “SUCCESS” mirando logs (simple)
    const succeeded: Record<string, string> = {};
    const finished = await this.prisma.run.findMany({
      where: { status: { equals: Prisma.RunStatus.SUCCESS } },
    });
    for (const r of finished) {
      const actionId = (r.log as any)?.meta?.actionId;
      if (actionId) succeeded[actionId] = 'SUCCESS';
    }

    // 2) recorrer schedule en orden y elegir la primera pendiente con pre cumplidos
    for (const action of this.plan.schedule) {
      if (succeeded[action.id]) continue;

      // gates mínimos
      const pre = action.pre || [];
      const needsEnv = pre
        .filter((p: string) => p.startsWith('env:'))
        .map((p: string) => p.replace('env:', '').toUpperCase());
      const needsDb = pre.some((p: string) => p === 'db:reachable');
      const deps = pre
        .filter((p: string) => p.includes(':SUCCESS'))
        .map((p: string) => p.split(':')[0]);

      if (needsEnv.length && !(await this.gates.checkEnv(needsEnv))) continue;
      if (needsDb && !(await this.gates.checkDbReachable())) continue;
      const depsOk = await this.gates.checkDepsSucceeded(
        Object.fromEntries(deps.map((d) => [d, succeeded[d] ?? ''])),
      );
      if (!depsOk) continue;

      // 3) encolar run y salir (ascendente, uno por tick)
      await this.runs.createRun(action.workflowId, action.nodes, {
        actionId: action.id,
        level: action.level,
      });
      this.logger.log(`Enqueued action ${action.id}`);
      break;
    }

    return { ok: true };
  }
}
