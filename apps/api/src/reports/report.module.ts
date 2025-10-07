import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportScheduler } from './report.scheduler';
import { SlackNotifier } from './slack-notifier';
import { EmailNotifier } from './email-notifier';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportController } from './report.controller';
import { OpenAIReporterService } from './openai.reporter.service';

// Beautifier
import { BeautifierStrategy } from './beautifier/beautifier.strategy';
import { OllamaBeautifier } from './beautifier/beautifier.ollama.service';
import { HfBeautifier } from './beautifier/beautifier.hf.service';
import { GroqBeautifier } from './beautifier/beautifier.groq.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReportController],
  providers: [
    ReportService,
    ReportScheduler,
    SlackNotifier,
    EmailNotifier,
    OpenAIReporterService,
    // beautifiers
    BeautifierStrategy,
    OllamaBeautifier,
    HfBeautifier,
    GroqBeautifier,
  ],
  exports: [ReportService, BeautifierStrategy, OpenAIReporterService],
})
export class ReportModule {}
