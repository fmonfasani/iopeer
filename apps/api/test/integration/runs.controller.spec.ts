import { describe, expect, it, vi } from 'vitest';
import { RunsController } from '../../src/runs/runs.controller';
import { RunsService } from '../../src/runs/runs.service';

describe('RunsController (integration)', () => {
  it('creates a run and triggers asynchronous processing', async () => {
    vi.useFakeTimers();

    const processNextMock = vi.fn();
    const runsService = {
      createRun: vi.fn(async (workflowId: string, nodes: any[], meta?: any) => {
        setTimeout(() => processNextMock({ workflowId, nodes, meta }), 0);
        return { id: 'run-1', workflowId, nodes, meta, log: { stepLogs: [] } };
      }),
      listRecentRuns: vi.fn(),
    } as unknown as RunsService;

    const controller = new RunsController(runsService);
    (controller as any).runs = runsService;

    const result = await controller.create({
      workflowId: 'wf.integration',
      nodes: [{ id: 'n1', type: 'echo' }],
      meta: { traceId: 'trace-1' },
    });

    expect(result.workflowId).toBe('wf.integration');
    expect(runsService.createRun).toHaveBeenCalledWith(
      'wf.integration',
      [{ id: 'n1', type: 'echo' }],
      { traceId: 'trace-1' },
    );

    await vi.runAllTimersAsync();
    expect(processNextMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('lists recent runs', async () => {
    const listMock = vi.fn().mockResolvedValue([{ id: '1', workflowId: 'wf.integration' }]);
    const runsService = {
      createRun: vi.fn(),
      listRecentRuns: listMock,
    } as unknown as RunsService;

    const controller = new RunsController(runsService);
    (controller as any).runs = runsService;
    const result = await controller.list();
    expect(listMock).toHaveBeenCalledWith(50);
    expect(result).toEqual([{ id: '1', workflowId: 'wf.integration' }]);
  });
});
