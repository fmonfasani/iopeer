import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailNotifier {
  private readonly logger = new Logger(EmailNotifier.name);

  private getTransport() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP no configurado completamente. Se omite envío por email.');
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async send(subject: string, html: string, textFallback?: string) {
    const transporter = this.getTransport();
    if (!transporter) return;

    const from = process.env.REPORT_EMAIL_FROM ?? 'IOpeer Reports <noreply@iopeer.local>';
    const to = process.env.REPORT_EMAIL_TO;
    if (!to) {
      this.logger.warn('REPORT_EMAIL_TO no configurado. Se omite envío por email.');
      return;
    }

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: textFallback,
    });
  }
}
