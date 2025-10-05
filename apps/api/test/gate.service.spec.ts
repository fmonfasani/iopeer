import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GateService } from '../src/gates/gate.service';

describe('GateService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('checks env variables', async () => {
    process.env.REQUIRED = '1';
    const service = new GateService({} as any);

    await expect(service.checkEnv(['REQUIRED'])).resolves.toBe(true);
    await expect(service.checkEnv(['MISSING'])).resolves.toBe(false);
  });

  it('checks database reachability', async () => {
    const prismaOk = { $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) } as any;
    const prismaFail = { $queryRaw: vi.fn().mockRejectedValue(new Error('down')) } as any;

    const okService = new GateService(prismaOk);
    const failService = new GateService(prismaFail);

    await expect(okService.checkDbReachable()).resolves.toBe(true);
    await expect(failService.checkDbReachable()).resolves.toBe(false);
  });

  it('checks dependency results', async () => {
    const service = new GateService({} as any);
    await expect(
      service.checkDepsSucceeded({ A: 'SUCCESS', B: 'SUCCESS' }),
    ).resolves.toBe(true);
    await expect(service.checkDepsSucceeded({ A: 'ERROR' })).resolves.toBe(false);
  });
});
