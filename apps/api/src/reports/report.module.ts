import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportScheduler } from './report.scheduler';
import { SlackNotifier } from './slack-notifier';
import { EmailNotifier } from './email-notifier';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [
    PrismaClient,       // usa el PrismaClient directo; si tenés PrismaService, podés inyectarlo en su lugar
    ReportService,
    ReportScheduler,
    SlackNotifier,
    EmailNotifier,
  ],
  exports: [ReportService, ReportScheduler],
})
export class ReportModule {}
