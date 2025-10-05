import { Injectable } from '@nestjs/common';

@Injectable()
export class DelayStep {
  type = 'delay';
  async run(params: { ms?: number }) {
    const ms = Number(params?.ms ?? 0);
    if (ms > 0) await new Promise((r) => setTimeout(r, ms));
    return { delayedMs: ms };
  }
}
