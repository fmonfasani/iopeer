import { Injectable } from '@nestjs/common';

import type { StepContext } from './registry';

@Injectable()
export class EchoStep {
  type = 'echo';

  async run(params: { message?: string; value?: unknown }, context?: StepContext) {
    const resolved =
      params?.message ?? params?.value ?? context?.previousOutput ?? 'echo';
    return { value: resolved, message: String(resolved), ts: new Date().toISOString() };
  }
}
