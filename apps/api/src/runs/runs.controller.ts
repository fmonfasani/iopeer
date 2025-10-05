import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
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
      return { id, type, params: n.params ?? {} };
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
      return { id: `n${idx + 1}`, type: s.key, params: s.params ?? {} };
    });
  }
  throw new BadRequestException('Debes enviar "nodes" o "steps" como array');
}

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
  async create(@Body() body: any) {
    try {
      const workflowId = body?.workflowId;
      if (!workflowId || typeof workflowId !== 'string') {
        throw new BadRequestException('workflowId (string) es requerido');
      }
      const nodes = toNodes(body);
      return await this.runs.createRun(workflowId, nodes, body?.meta);
    } catch (e: any) {
      // Si Prisma rechaza el enum/valor, devolvemos 400 con detalle
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

  // Endpoint útil para smoke test rápido del pipeline
  @Post('/runs/test')
  async createTest() {
    const nodes: NodeNew[] = [
      { id: 'n1', type: 'echo', params: { value: 'hola' } },
    ];
    return this.runs.createRun('wf.test', nodes);
  }
}
