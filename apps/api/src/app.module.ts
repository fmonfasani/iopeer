/* c8 ignore file */
import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RunsController } from './runs/runs.controller';
import { RunsService } from './runs/runs.service';

import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { SchedulerService } from './scheduler/scheduler.service';
import { GateService } from './gates/gate.service';

// Registry/steps (si los usás como providers)
import { StepsRegistry } from './steps/registry';
import { EchoStep } from './steps/echo';
import { DelayStep } from './steps/delay';
import { HttpStep } from './steps/http';
import { PinoLoggerService } from './logger/pino-logger.service';

@Module({
  imports: [],
  controllers: [AppController, RunsController, HealthController, MetricsController],
  providers: [
    PrismaClient,
    AppService,
    PinoLoggerService,
    RunsService,
    SchedulerService,
    GateService,
    StepsRegistry,
    EchoStep,
    DelayStep,
    HttpStep,
  ],
})
export class AppModule {}
