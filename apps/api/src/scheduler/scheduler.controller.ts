import { Controller, Post } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly scheduler: SchedulerService) {}

  // Dispara 1 tick: evalúa pre/gates y si corresponde encola la próxima acción Lx
  @Post('next')
  async next() {
    return this.scheduler.tick();
  }
}
