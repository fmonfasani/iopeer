import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SlackNotifier {
  private readonly logger = new Logger(SlackNotifier.name);
  private readonly webhook = process.env.SLACK_WEBHOOK_URL;

  async send(text: string) {
    if (!this.webhook) {
      this.logger.warn('SLACK_WEBHOOK_URL no configurado. Se omite envío a Slack.');
      return;
    }
    const res = await fetch(this.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      this.logger.error(`Error enviando a Slack: ${res.status} ${res.statusText} ${body}`);
    }
  }
}
