import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RunsController } from '../src/runs/runs.controller';

const WORKFLOW_ID = '00000000-0000-0000-0000-000000000001';

describe('RunsController', () => {
  let runsService: {
    listRecentRuns: ReturnType<typeof vi.fn>;
    getRun: ReturnType<typeof vi.fn>;
    enqueueRun: ReturnType<typeof vi.fn>;
  };
  let controller: RunsController;

  beforeEach(() => {
    runsService = {
      listRecentRuns: vi.fn().mockResolvedValue([{ id: 'run-1' }]),
      getRun: vi.fn(),
      enqueueRun: vi.fn().mockResolvedValue('run-new'),
    };
    controller = new RunsController(runsService as any);
  });

  it('lists recent runs', async () => {
    const result = await controller.list();
    expect(result).toEqual([{ id: 'run-1' }]);
    expect(runsService.listRecentRuns).toHaveBeenCalledWith(50);
  });

  it('gets run by id', async () => {
    runsService.getRun.mockResolvedValue({ id: 'run-1' });
    const run = await controller.get('run-1');
    expect(run).toEqual({ id: 'run-1' });
    expect(runsService.getRun).toHaveBeenCalledWith('run-1');
  });

  it('throws when run does not exist', async () => {
    runsService.getRun.mockResolvedValue(null);
    await expect(controller.get('missing')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates run using nodes array', async () => {
    const body = {
      workflowId: WORKFLOW_ID,
      nodes: [
        { id: 'n1', type: 'echo', params: { value: 'hola' } },
        { id: 'n2', type: 'delay', params: { ms: 1 } },
      ],
      meta: { key: 'value' },
    };
    const req: any = { requestId: 'req-1' };

    const result = await controller.create(body, req);

    expect(result).toEqual({ id: 'run-new' });
    expect(runsService.enqueueRun).toHaveBeenCalledWith({
      workflowId: WORKFLOW_ID,
      nodes: body.nodes,
      meta: body.meta,
      requestId: 'req-1',
    });
  });

  it('creates run using legacy steps array', async () => {
    const body = {
      workflowId: WORKFLOW_ID,
      steps: [
        { key: 'echo', params: { value: 'hola' } },
        { key: 'delay', params: { ms: 5 } },
      ],
    };
    const req: any = { requestId: 'legacy' };

    await controller.create(body, req);

    expect(runsService.enqueueRun).toHaveBeenCalledWith({
      workflowId: WORKFLOW_ID,
      nodes: [
        { id: 'n1', type: 'echo', params: { value: 'hola' } },
        { id: 'n2', type: 'delay', params: { ms: 5 } },
      ],
      meta: undefined,
      requestId: 'legacy',
    });
  });

  it('rejects invalid payloads', async () => {
    await expect(controller.create({}, { requestId: 'req' } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      controller.create(
        { workflowId: WORKFLOW_ID, nodes: [{ id: 'n1' }] },
        { requestId: 'req' } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('translates prisma validation errors to bad request', async () => {
    runsService.enqueueRun.mockRejectedValue(new Error('PrismaClientValidationError: invalid'));
    await expect(
      controller.create({ workflowId: WORKFLOW_ID, nodes: [{ id: 'n1', type: 'echo' }] }, { requestId: 'req' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates other errors as bad request', async () => {
    runsService.enqueueRun.mockRejectedValue(new Error('boom'));
    await expect(
      controller.create({ workflowId: WORKFLOW_ID, nodes: [{ id: 'n1', type: 'echo' }] }, { requestId: 'req' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates test run', async () => {
    runsService.enqueueRun.mockResolvedValue('test-run');
    const result = await controller.createTest();
    expect(result).toEqual({ id: 'test-run' });
    expect(runsService.enqueueRun).toHaveBeenCalledWith({
      workflowId: 'wf.test',
      nodes: [{ id: 'n1', type: 'echo', params: { value: 'hola' } }],
    });
  });
});
