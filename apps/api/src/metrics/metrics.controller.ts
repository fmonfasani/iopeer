import { Controller, Get } from '@nestjs/common';

import { RunsService } from '../runs/runs.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly runs: RunsService) {}

  @Get()
  get() {
    return this.runs.getStats();
  }
}
