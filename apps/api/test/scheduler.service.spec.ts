import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SchedulerService } from '../src/scheduler/scheduler.service';

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

const { readFile } = await import('fs/promises');

describe('SchedulerService', () => {
  const enqueueRun = vi.fn();
  let service: SchedulerService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    vi.spyOn(global, 'setInterval');
    vi.spyOn(global, 'clearInterval');
    (readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      JSON.stringify({
        schedule: [
          { id: 'one', workflowId: 'wf-1', nodes: [{ id: 'n1', type: 'echo' }] },
          { id: 'two', workflowId: 'wf-2', nodes: [{ id: 'n1', type: 'delay' }] },
        ],
        plan: 'test-plan',
      }),
    );
    enqueueRun.mockResolvedValue('run');
    service = new SchedulerService({ enqueueRun } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispatches runs from plan on tick', async () => {
    await service.tick();
    expect(enqueueRun).toHaveBeenCalledTimes(2);
    expect(enqueueRun).toHaveBeenCalledWith(
      expect.objectContaining({ workflowId: 'wf-1', requestId: expect.stringMatching(/^scheduler-/) }),
    );
  });

  it('starts and stops interval on module lifecycle', async () => {
    const tickSpy = vi.spyOn(service, 'tick').mockResolvedValue();
    service.onModuleInit();
    expect(setInterval).toHaveBeenCalled();

    await vi.advanceTimersToNextTimerAsync();
    expect(tickSpy).toHaveBeenCalled();

    service.onModuleDestroy();
    expect(clearInterval).toHaveBeenCalled();
  });
});
