import { describe, expect, it, vi } from 'vitest';
import { StepsRegistry } from '../../../src/steps/registry';
import { EchoStep } from '../../../src/steps/echo';
import { DelayStep } from '../../../src/steps/delay';
import { HttpStep } from '../../../src/steps/http';

describe('StepsRegistry', () => {
  const echo = { run: vi.fn(), type: 'echo' } as unknown as EchoStep;
  const delay = { run: vi.fn(), type: 'delay' } as unknown as DelayStep;
  const http = { run: vi.fn(), type: 'http' } as unknown as HttpStep;
  const registry = new StepsRegistry(echo, delay, http);

  it('returns registered steps', () => {
    expect(registry.get('echo')).toBe(echo);
    expect(registry.get('delay')).toBe(delay);
    expect(registry.get('http')).toBe(http);
  });

  it('throws when step is missing', () => {
    expect(() => registry.get('unknown')).toThrow('Unknown step type: unknown');
  });
});
