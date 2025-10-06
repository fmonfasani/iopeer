import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportScheduler } from './report.scheduler';
import { SlackNotifier } from './slack-notifier';
import { EmailNotifier } from './email-notifier';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReportService, ReportScheduler, SlackNotifier, EmailNotifier],
  exports: [ReportService, ReportScheduler],
})
export class ReportModule {}
