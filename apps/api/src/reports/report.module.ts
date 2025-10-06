import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportScheduler } from './report.scheduler';
import { SlackNotifier } from './slack-notifier';
import { EmailNotifier } from './email-notifier';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportController } from './report.controller';

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
    // beautifiers
    BeautifierStrategy,
    OllamaBeautifier,
    HfBeautifier,
    GroqBeautifier,
  ],
  exports: [ReportService, BeautifierStrategy],
})
export class ReportModule {}
