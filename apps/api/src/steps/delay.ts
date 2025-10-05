import { Injectable } from '@nestjs/common';

import type { StepContext } from './registry';

@Injectable()
export class DelayStep {
  type = 'delay';

  async run(params: { ms?: number }, _context?: StepContext) {
    const ms = Number(params?.ms ?? 0);
    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
    return { delayedMs: ms };
  }
}
