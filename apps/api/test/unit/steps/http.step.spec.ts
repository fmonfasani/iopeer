import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStep } from '../../../src/steps/http';

describe('HttpStep', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed json when response is json', async () => {
    const json = vi.fn().mockResolvedValue({ ok: true });
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, json, text: vi.fn() });
    // @ts-expect-error - override global fetch for testing
    global.fetch = fetchMock;

    const step = new HttpStep();
    const result = await step.run({ url: 'https://example.com', expect: { status: 200 } });

    expect(fetchMock).toHaveBeenCalledWith('https://example.com', {
      method: 'GET',
      headers: undefined,
      body: undefined,
    });
    expect(result).toEqual({ status: 200, data: { ok: true } });
  });

  it('falls back to text when json parsing fails', async () => {
    const json = vi.fn().mockRejectedValue(new Error('not json'));
    const text = vi.fn().mockResolvedValue('plain text');
    const fetchMock = vi.fn().mockResolvedValue({ status: 200, json, text });
    // @ts-expect-error - override global fetch for testing
    global.fetch = fetchMock;

    const step = new HttpStep();
    const result = await step.run({ url: 'https://example.com/text' });

    expect(text).toHaveBeenCalled();
    expect(result).toEqual({ status: 200, data: 'plain text' });
  });

  it('returns undefined data when text parsing also fails', async () => {
    const json = vi.fn().mockRejectedValue(new Error('not json'));
    const text = vi.fn().mockRejectedValue(new Error('no text'));
    const fetchMock = vi.fn().mockResolvedValue({ status: 204, json, text });
    // @ts-expect-error - override global fetch for testing
    global.fetch = fetchMock;

    const step = new HttpStep();
    const result = await step.run({ url: 'https://example.com/empty' });

    expect(result).toEqual({ status: 204, data: undefined });
  });

  it('throws when expected status differs', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 500,
      json: vi.fn().mockResolvedValue({ message: 'error' }),
      text: vi.fn(),
    });
    // @ts-expect-error - override global fetch for testing
    global.fetch = fetchMock;

    const step = new HttpStep();
    await expect(
      step.run({ url: 'https://example.com', expect: { status: 200 } }),
    ).rejects.toThrow('http expect status 200, got 500');
  });

  it('throws when url is missing', async () => {
    const step = new HttpStep();
    await expect(step.run({})).rejects.toThrow('http step requires url');
  });

  it('throws when params are omitted entirely', async () => {
    const step = new HttpStep();
    await expect(step.run(undefined as any)).rejects.toThrow('http step requires url');
  });

  it('stringifies body payloads', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 201,
      json: vi.fn().mockResolvedValue({ ok: true }),
      text: vi.fn(),
    });
    // @ts-expect-error - override global fetch for testing
    global.fetch = fetchMock;

    const step = new HttpStep();
    await step.run({ url: 'https://example.com/create', method: 'POST', body: { foo: 'bar' } });

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/create', {
      method: 'POST',
      headers: undefined,
      body: JSON.stringify({ foo: 'bar' }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });
});
