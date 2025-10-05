import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RunsService } from './runs.service';

@Controller()
export class RunsController {
  constructor(private runs: RunsService) {}

  @Get('health')
  health() {
    return { ok: true, ts: new Date().toISOString() };
  }

  @Post('runs')
  async create(@Body() body: { workflowId: string; nodes: any[]; meta?: any }) {
    return this.runs.createRun(body.workflowId, body.nodes, body.meta);
  }

  @Get('runs')
  list() {
    return this.runs.listRecentRuns(50);
  }

  @Get('runs/:id')
  get(@Param('id') id: string) {
    return this.runs.getRun(id);
  }

  // Dummy para L3 del plan-bootstrap
  @Post('runs/test')
  async test(@Body() body?: any) {
    const nodes = [
      { id: 'n1', type: 'delay', params: { ms: 200 } },
      { id: 'n2', type: 'echo', params: { message: 'Queue up' } },
    ];
    return this.runs.createRun('wf.runner.basic', nodes, {
      dryRun: !!body?.dryRun,
    });
  }
}
