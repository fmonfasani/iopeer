import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { RunsService } from './runs.service';

type StepLegacy = { key: string; params?: any };
type NodeNew = { id: string; type: string; params?: any };

function toNodes(input: any): NodeNew[] {
  // Acepta nodes o steps
  if (Array.isArray(input?.nodes)) {
    // validar shape mínimo
    return input.nodes.map((n: any, idx: number) => {
      if (!n || typeof n !== 'object') {
        throw new BadRequestException(`nodes[${idx}] debe ser objeto`);
      }
      const id = n.id ?? `n${idx + 1}`;
      const type = n.type;
      if (!type || typeof type !== 'string') {
        throw new BadRequestException(`nodes[${idx}].type requerido`);
      }
      const base: NodeNew = { id, type };
      if (n.params !== undefined) base.params = n.params;
      return base;
    });
  }
  if (Array.isArray(input?.steps)) {
    return input.steps.map((s: StepLegacy, idx: number) => {
      if (!s || typeof s !== 'object') {
        throw new BadRequestException(`steps[${idx}] debe ser objeto`);
      }
      if (!s.key || typeof s.key !== 'string') {
        throw new BadRequestException(`steps[${idx}].key requerido`);
      }
      const base: NodeNew = { id: `n${idx + 1}`, type: s.key };
      if (s.params !== undefined) base.params = s.params;
      return base;
    });
  }
  throw new BadRequestException('Debes enviar "nodes" o "steps" como array');
}

type RequestWithContext = Request & { requestId?: string };

@Controller()
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Get('/runs')
  async list() {
    return this.runs.listRecentRuns(50);
  }

  @Get('/runs/:id')
  async get(@Param('id') id: string) {
    const run = await this.runs.getRun(id);
    if (!run) throw new BadRequestException('Run no encontrado');
    return run;
  }

  @Post('/runs')
  async create(@Body() body: any, @Req() req?: RequestWithContext) {
    try {
      const workflowId = body?.workflowId;
      if (!workflowId || typeof workflowId !== 'string') {
        throw new BadRequestException('workflowId (string) es requerido');
      }
      const nodes = toNodes(body);
      const meta = body?.meta;
      const requestId = req?.requestId;

      const createRun = (this.runs as any).createRun;
      if (typeof createRun === 'function') {
        const args: any[] = [workflowId, nodes, meta];
        if (requestId && createRun.length >= 4) {
          args.push(requestId);
        }
        const run = await createRun.apply(this.runs, args);
        if (run && typeof run === 'object') {
          return run;
        }
        if (run) {
          return { id: run };
        }
        return { id: undefined };
      }

      const enqueueRun = (this.runs as any).enqueueRun;
      if (typeof enqueueRun === 'function') {
        const id = await enqueueRun.call(this.runs, {
          workflowId,
          nodes,
          meta,
          requestId,
        });
        return { id };
      }

      throw new Error('RunsService.createRun no está disponible');
    } catch (e: any) {
      const msg = e?.message || 'Error al crear run';
      if (msg.includes('PrismaClientValidationError')) {
        throw new BadRequestException(
          'Validación Prisma: revisá workflowId/nodes y enum RunStatus',
        );
      }
      if (e?.status === 400) throw e;
      throw new BadRequestException(msg);
    }
  }

  @Post('/runs/test')
  async createTest() {
    const nodes: NodeNew[] = [{ id: 'n1', type: 'echo', params: { value: 'hola' } }];
    const run = await (this.runs as any).createRun?.('wf.test', nodes);
    if (run && typeof run === 'object' && 'id' in run) {
      return { id: (run as any).id };
    }
    const id = run ?? (await (this.runs as any).enqueueRun?.({ workflowId: 'wf.test', nodes }));
    return { id };
  }
}
