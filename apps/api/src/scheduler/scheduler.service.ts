import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, RunStatus } from '@prisma/client';
import { promises as fs, accessSync, constants } from 'fs';
import * as path from 'path';

const PLAN_FILENAME = 'plan-bootstrap.json';
const SCHEDULER_INTERVAL_MS = 60_000; // 60s

function existsSyncSafe(p: string): boolean {
  try {
    accessSync(p, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Busca el plan en múltiples ubicaciones razonables, para que funcione
 * en dev y en build, y tanto si el cwd es el monorepo como apps/api.
 *
 * Estructuras soportadas:
 *  - apps/api/src/... (dev)
 *  - apps/api/dist/... (build)
 *  - Carpeta de planes en: apps/api/plans/*
 */
function resolvePlanPath(): string {
  const candidates = [
    // Si corrés desde apps/api como cwd:
    path.resolve(process.cwd(), 'plans', PLAN_FILENAME),
    // Si corrés desde la raíz del monorepo:
    path.resolve(process.cwd(), 'apps', 'api', 'plans', PLAN_FILENAME),
    // Relativo al archivo compilado (dist/scheduler):
    path.resolve(__dirname, '..', 'plans', PLAN_FILENAME),
    // Por si el dist queda un nivel distinto:
    path.resolve(__dirname, '..', '..', 'plans', PLAN_FILENAME),
  ];

  const found = candidates.find(existsSyncSafe);
  if (!found) {
    throw new Error(
      `No se encontró ${PLAN_FILENAME}. Probé:\n` + candidates.join('\n'),
    );
  }
  return found;
}

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('SchedulerService');
  private timer: NodeJS.Timeout | null = null;

  // Si ya tenés un PrismaService inyectable, podés reemplazar por él.
  // Acá usamos PrismaClient directo para evitar dependencias.
  private readonly prisma = new PrismaClient();

  async onModuleInit() {
    this.logger.log(`scheduler:start`, { interval: SCHEDULER_INTERVAL_MS });
    this.timer = setInterval(() => {
      this.tick().catch((err) => {
        this.logger.error('scheduler:tick:error', { err });
      });
    }, SCHEDULER_INTERVAL_MS);

    // Podés ejecutar un primer tick al levantar
    try {
      await this.tick();
    } catch (err) {
      this.logger.error('scheduler:tick:error', { err });
    }
  }

  async onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.prisma.$disconnect();
  }

  /**
   * Tick del scheduler:
   *  - Lee el plan de bootstrap (si existe).
   *  - Loguea últimos runs SUCCESS (ajustado al enum correcto).
   */
  async tick() {
    // 1) Leer plan-bootstrap.json (si existe en alguna ubicación válida)
    let plan: any | null = null;
    try {
      const planPath = resolvePlanPath();
      const raw = await fs.readFile(planPath, 'utf8');
      plan = JSON.parse(raw);
    } catch (e) {
      // Si no existe, logueamos y seguimos (no consideramos fatal).
      this.logger.error('scheduler:tick:error', { err: e });
    }

    // 2) Consultar últimos runs con estado SUCCESS (no SUCCEEDED)
    const finished = await this.prisma.run.findMany({
      where: { status: RunStatus.SUCCESS },
      orderBy: { finishedAt: 'desc' },
      take: 5,
    });

    this.logger.log(`tick: ${finished.length} runs SUCCESS recientes`);
    if (plan) {
      this.logger.debug?.(`plan: ${PLAN_FILENAME} cargado`, {
        keys: Object.keys(plan ?? {}),
      });
    }
  }

  /**
   * Expuesto para el SchedulerController /scheduler/next si lo usás:
   * fuerza un próximo tick ahora mismo.
   */
  async next(): Promise<{ ok: true }> {
    await this.tick();
    return { ok: true };
  }
}
