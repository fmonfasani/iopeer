import { Injectable } from '@nestjs/common';

@Injectable()
export class EchoStep {
  type = 'echo';
  async run(params: { message?: string }) {
    const message = params?.message ?? 'echo';
    return { message, ts: new Date().toISOString() };
  }
}
