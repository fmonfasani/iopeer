import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RunsController } from './runs/runs.controller';
import { RunsService } from './runs/runs.service';
import { StepsRegistry } from './steps/registry';
import { EchoStep } from './steps/echo';
import { DelayStep } from './steps/delay';
import { HttpStep } from './steps/http';
import { GateService } from './gates/gate.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { HealthController } from './health/health.controller';

@Module({
  controllers: [AppController, RunsController, HealthController],
  providers: [
    AppService,
    PrismaClient,
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
