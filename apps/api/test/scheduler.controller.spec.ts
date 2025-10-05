import { describe, expect, it, vi } from 'vitest';

import { SchedulerController } from '../src/scheduler/scheduler.controller';

describe('SchedulerController', () => {
  it('delegates to scheduler service', async () => {
    const scheduler = { tick: vi.fn().mockResolvedValue('ok') } as any;
    const controller = new SchedulerController(scheduler);
    const result = await controller.next();
    expect(result).toBe('ok');
    expect(scheduler.tick).toHaveBeenCalled();
  });
});
