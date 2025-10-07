import { describe, expect, it, vi } from 'vitest';
import { GateService } from '../../../src/gates/gate.service';
import { RUN_STATUS } from '../../../src/runs/run-status';
import { createMockPrismaClient } from '../../factories';

describe('GateService', () => {
  it('checkEnv returns true when all env vars exist', async () => {
    const { client } = createMockPrismaClient();
    const service = new GateService(client);
    process.env.TEST_ENV_PRESENT = 'yes';
    await expect(service.checkEnv(['TEST_ENV_PRESENT'])).resolves.toBe(true);
    delete process.env.TEST_ENV_PRESENT;
  });

  it('checkEnv returns false when env var missing', async () => {
    const { client } = createMockPrismaClient();
    const service = new GateService(client);
    await expect(service.checkEnv(['MISSING_ENV'])).resolves.toBe(false);
  });

  it('checkDbReachable returns true when query succeeds', async () => {
    const mock = createMockPrismaClient();
    const service = new GateService(mock.client);
    await expect(service.checkDbReachable()).resolves.toBe(true);
    expect(mock.client.$queryRaw).toHaveBeenCalled();
  });

  it('checkDbReachable returns false when query fails', async () => {
    const mock = createMockPrismaClient();
    const querySpy = mock.client.$queryRaw as unknown as ReturnType<typeof vi.fn>;
    querySpy.mockRejectedValueOnce(new Error('db down'));
    const service = new GateService(mock.client);
    await expect(service.checkDbReachable()).resolves.toBe(false);
  });

  it('checkDepsSucceeded validates all deps are SUCCEEDED', async () => {
    const { client } = createMockPrismaClient();
    const service = new GateService(client);
    await expect(
      service.checkDepsSucceeded({ A: RUN_STATUS.SUCCESS, B: RUN_STATUS.SUCCESS }),
    ).resolves.toBe(true);
    await expect(service.checkDepsSucceeded({ A: RUN_STATUS.PENDING })).resolves.toBe(false);
  });
});
