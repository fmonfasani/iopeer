import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RunsService } from './runs.service';
import { StepsRegistry } from '../steps/registry';

class PrismaStub {
  run = {
    create: vi.fn(async ({ data }: any) => ({ id: 'run_1', ...data })),
    update: vi.fn(async ({ where: { id }, data }: any) => ({ id, ...data })),
    findUnique: vi.fn(async ({ where: { id } }: any) => ({
      id,
      status: 'SUCCEEDED',
      log: {},
    })),
  };
}

class StepsStub implements Partial<StepsRegistry> {
  get(type: string) {
    return {
      run: async (params: any) => ({ ok: true, type, params }),
    } as any;
  }
}

describe('RunsService', () => {
  let service: RunsService;
  let prisma: PrismaStub;
  let steps: StepsStub;

  beforeEach(() => {
    prisma = new PrismaStub();
    steps = new StepsStub();
    service = new RunsService(prisma as any, steps as any);
  });

  it('enqueue + processes nodes to SUCCEEDED', async () => {
    const nodes = [{ id: 'n1', type: 'echo', params: { message: 'hi' } }];
    const run = await service.createRun('wf.test', nodes);
    expect(run.status).toBe('QUEUED');

    // espera un tick para processNext
    await new Promise((r) => setTimeout(r, 20));

    expect(prisma.run.update).toHaveBeenCalled();
    const lastUpdate = prisma.run.update.mock.calls.at(-1)?.[0];
    expect(lastUpdate.data.status).toBe('SUCCEEDED');
  });
});
