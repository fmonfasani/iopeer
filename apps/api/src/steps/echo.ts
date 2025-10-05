import { Injectable } from '@nestjs/common';

import type { StepContext } from './registry';

@Injectable()
export class EchoStep {
  type = 'echo';

  async run(params: { message?: string; value?: any }, context?: StepContext) {
    const value = params?.value ?? params?.message ?? context?.previousOutput ?? null;
    return { value, ts: new Date().toISOString() };
  }
}
