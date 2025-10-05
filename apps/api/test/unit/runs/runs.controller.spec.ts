import { describe, expect, it, vi } from 'vitest';
import { RunsController } from '../../../src/runs/runs.controller';
import { RunsService } from '../../../src/runs/runs.service';

describe('RunsController', () => {
  it('delegates to service methods', async () => {
    const createRun = vi.fn().mockResolvedValue({ id: 'run-1' });
    const listRecentRuns = vi.fn().mockResolvedValue([{ id: 'run-1' }]);
    const getRun = vi.fn().mockResolvedValue({ id: 'run-1', status: 'QUEUED' });

    const runsService = {
      createRun,
      listRecentRuns,
      getRun,
    } as unknown as RunsService;

    const controller = new RunsController(runsService);

    const created = await controller.create({ workflowId: 'wf', nodes: [] });
    expect(created).toEqual({ id: 'run-1' });
    expect(createRun).toHaveBeenCalledWith('wf', [], undefined);

    const listed = await controller.list();
    expect(listRecentRuns).toHaveBeenCalledWith(50);
    expect(listed).toEqual([{ id: 'run-1' }]);

    const fetched = await controller.get('run-1');
    expect(getRun).toHaveBeenCalledWith('run-1');
    expect(fetched).toEqual({ id: 'run-1', status: 'QUEUED' });
  });
});
