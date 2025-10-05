import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DelayStep } from '../src/steps/delay';
import { EchoStep } from '../src/steps/echo';
import { StepsRegistry } from '../src/steps/registry';

describe('Steps', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('echo step returns payload with timestamp', async () => {
    const step = new EchoStep();
    const result = await step.run({ value: 'hola' }, { previousOutput: 'prev' } as any);
    expect(result.value).toBe('hola');
    expect(new Date(result.ts).toString()).not.toBe('Invalid Date');
  });

  it('delay step waits requested time', async () => {
    const step = new DelayStep();
    const promise = step.run({ ms: 100 });
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toEqual({ delayedMs: 100 });
  });

  it('registry resolves steps and throws on unknown type', () => {
    const httpStep = { type: 'http', run: vi.fn() } as any;
    const registry = new StepsRegistry(new EchoStep(), new DelayStep(), httpStep);
    const echo = registry.get('echo');
    expect(echo.type).toBe('echo');
    expect(() => registry.get('missing')).toThrow('Unknown step type');
  });
});
