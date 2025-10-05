import { describe, expect, it, vi } from 'vitest';

import { HealthController } from '../src/health/health.controller';

describe('HealthController', () => {
  it('returns db up when query succeeds', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]),
    } as any;

    const controller = new HealthController(prisma);
    const result = await controller.get();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.db).toBe('up');
  });

  it('returns db down when query fails', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('boom')),
    } as any;

    const controller = new HealthController(prisma);
    const result = await controller.get();

    expect(result.ok).toBe(true);
    expect(result.db).toBe('down');
  });
});
