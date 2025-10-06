import { Controller, Post } from '@nestjs/common';
import { ReportService } from './report.service';
import { BeautifierStrategy } from './beautifier/beautifier.strategy';
import { SlackNotifier } from './slack-notifier';

@Controller('reports')
export class ReportController {
  constructor(
    private readonly report: ReportService,
    private readonly beautifier: BeautifierStrategy,
    private readonly slack: SlackNotifier,
  ) {}

  @Post('beautify')
  async sendBeautifiedReport() {
    const { text } = await this.report.buildStatusReport();
    const pretty = await this.beautifier.beautify(text);
    await this.slack.send(pretty);
    return { ok: true, length: pretty.length };
  }
}
