import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RunsService } from './runs/runs.service';
import { RunsController } from './runs/runs.controller';
import { StepsRegistry } from './steps/registry';
import { EchoStep } from './steps/echo';
import { DelayStep } from './steps/delay';
import { HttpStep } from './steps/http';
import { GateService } from './gates/gate.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { HealthController } from './health/health.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SchedulerController } from './scheduler/scheduler.controller';
import { MetricsController } from './metrics/metrics.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    RunsController,
    HealthController,
    SchedulerController,
    MetricsController,
  ],
  providers: [
    PrismaClient,
    AppService,
    RunsService,
    StepsRegistry,
    EchoStep,
    DelayStep,
    HttpStep,
    GateService,
    SchedulerService,
  ],
})
export class AppModule {}
