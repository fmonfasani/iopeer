import { describe, expect, it } from 'vitest';
import { EchoStep } from '../../../src/steps/echo';

describe('EchoStep', () => {
  it('returns message and timestamp', async () => {
    const step = new EchoStep();
    const result = await step.run({ message: 'hello' });
    expect(result.message).toBe('hello');
    expect(result.ts).toBeTypeOf('string');
  });

  it('defaults message when not provided', async () => {
    const step = new EchoStep();
    const result = await step.run({});
    expect(result.message).toBe('echo');
  });
});
