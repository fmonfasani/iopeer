import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportService } from './report.service';
import { SlackNotifier } from './slack-notifier';
import { EmailNotifier } from './email-notifier';
import { BeautifierStrategy } from './beautifier/beautifier.strategy';

@Injectable()
export class ReportScheduler {
  private readonly logger = new Logger(ReportScheduler.name);
  private readonly cronExp = process.env.REPORT_CRON ?? CronExpression.EVERY_DAY_AT_NOON;

  constructor(
    private readonly report: ReportService,
    private readonly slack: SlackNotifier,
    private readonly email: EmailNotifier,
    private readonly beautifier: BeautifierStrategy,
  ) {}

  // Ejecuta según CRON (por defecto todos los días al mediodía)
  @Cron(function (this: ReportScheduler) { return this.cronExp; } as any)
  async handleCron() {
    try {
      this.logger.log(`Generando reporte (CRON=${this.cronExp})...`);
      const { text, html } = await this.report.buildStatusReport();

      await Promise.allSettled([
        this.slack.send(text),
        this.email.send('📊 IOpeer — Status Report', html, text),
      ]);

      this.logger.log('Reporte enviado a Slack y/o Email (según config).');
    } catch (e: any) {
      this.logger.error('Error generando/enviando el reporte', e?.stack ?? e);
    }
  }

  // Método utilitario para disparar manualmente desde cualquier parte
  async runNow() {
    const { text, html } = await this.report.buildStatusReport();
    await Promise.allSettled([
      this.slack.send(text),
      this.email.send('📊 IOpeer — Status Report (manual)', html, text),
    ]);
    return { ok: true };
  }
  
}
