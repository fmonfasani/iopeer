import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpStep } from '../src/steps/http';

const originalFetch = global.fetch;

describe('HttpStep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('retries up to three times on 5xx responses with backoff', async () => {
    const responses = [
      createResponse(500, 'error-1'),
      createResponse(502, 'error-2'),
      createResponse(200, '{"ok":true}')
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(responses[0])
      .mockResolvedValueOnce(responses[1])
      .mockResolvedValueOnce(responses[2]);

    global.fetch = fetchMock as unknown as typeof global.fetch;

    const step = new HttpStep();
    const promise = step.run({ url: 'https://example.com' });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.status).toBe(200);
    expect(result.ok).toBe(true);
  });
});

function createResponse(status: number, body: string) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async text() {
      return body;
    },
  } as Response;
}
