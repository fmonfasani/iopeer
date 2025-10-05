import { describe, expect, it } from 'vitest';
import { HealthController } from '../../../src/health/health.controller';

describe('HealthController', () => {
  it('returns ok response with timestamp', () => {
    const controller = new HealthController();
    const result = controller.ok();
    expect(result.ok).toBe(true);
    expect(() => new Date(result.ts)).not.toThrow();
  });
});
