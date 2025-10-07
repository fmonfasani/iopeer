import { Injectable } from '@nestjs/common';

import type { StepContext } from './registry';

@Injectable()
export class HttpStep {
  type = 'http';

  async run(
    params: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
      expect?: { status?: number };
    },
    _context?: StepContext,
  ) {
    const { url, method = 'GET', headers, body, expect } = params ?? ({} as any);
    if (!url) {
      throw new Error('http step requires url');
    }

    const fetchImpl: typeof fetch | undefined = (globalThis as any).fetch;
    if (!fetchImpl) {
      throw new Error('fetch is not available in this environment');
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = await fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (expect?.status != null && response.status !== expect.status) {
        throw new Error(`http expect status ${expect.status}, got ${response.status}`);
      }

      const successful = response.status >= 200 && response.status < 300;
      if (!successful && response.status >= 500 && attempt < 3) {
        await this.waitBackoff(attempt);
        continue;
      }

      if (!successful) {
        lastError = new Error(`http request failed with status ${response.status}`);
        break;
      }

      const data = await this.parseBody(response);
      const payload: any = { status: response.status, data };
      Object.defineProperty(payload, 'ok', {
        value: true,
        enumerable: false,
        configurable: false,
        writable: false,
      });
      return payload;
    }

    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error('http step failed');
  }

  private async parseBody(response: any) {
    if (typeof response.json === 'function') {
      try {
        return await response.json();
      } catch {
        // ignore and fallback to text
      }
    }

    if (typeof response.text === 'function') {
      try {
        return await response.text();
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  private async waitBackoff(attempt: number) {
    const base = 200 * Math.pow(2, attempt - 1);
    const jitter = Math.floor(Math.random() * 100);
    const delay = base + jitter;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
