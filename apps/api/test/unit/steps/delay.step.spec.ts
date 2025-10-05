import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DelayStep } from '../../../src/steps/delay';

describe('DelayStep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('waits for provided milliseconds', async () => {
    const step = new DelayStep();
    const promise = step.run({ ms: 100 });

    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    expect(result).toEqual({ delayedMs: 100 });
  });

  it('calls setTimeout when delay is greater than zero', async () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    const step = new DelayStep();
    const promise = step.run({ ms: 50 });

    await vi.advanceTimersByTimeAsync(50);
    await promise;

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 50);
  });

  it('resolves immediately when delay is zero', async () => {
    vi.useRealTimers();
    const step = new DelayStep();
    await expect(step.run({ ms: 0 })).resolves.toEqual({ delayedMs: 0 });
  });
});
