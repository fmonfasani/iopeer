import { describe, expect, it, vi } from 'vitest';
import { MetricsController } from '../../../src/metrics/metrics.controller';
import { createMockPrismaClient } from '../../factories';

describe('MetricsController', () => {
  it('returns aggregated metrics', async () => {
    const mock = createMockPrismaClient();
    const controller = new MetricsController(undefined, mock.client);

    mock.client.run.count = vi
      .fn()
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3);

    const result = await controller.getMetrics();

    expect(mock.client.run.count).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      runsTotal: 10,
      runsFailed: 3,
      errorRatePct: 30,
    });
    expect(result.uptimeSec).toBeTypeOf('number');
  });

  it('returns zero error rate when there are no runs', async () => {
    const mock = createMockPrismaClient();
    const controller = new MetricsController(undefined, mock.client);

    mock.client.run.count = vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const result = await controller.getMetrics();

    expect(result.runsTotal).toBe(0);
    expect(result.runsFailed).toBe(0);
    expect(result.errorRatePct).toBe(0);
  });
});
