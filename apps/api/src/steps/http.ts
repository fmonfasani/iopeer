import { Injectable } from '@nestjs/common';

import type { StepContext } from './registry';

const DEFAULT_TIMEOUT = Number(process.env.HTTP_STEP_TIMEOUT_MS ?? 10_000);
const MAX_ATTEMPTS = 3;

@Injectable()
export class HttpStep {
  type = 'http';

  async run(
    params: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: any;
      expect?: { status?: number };
    },
    _context?: StepContext,
  ) {
    const { url, method = 'GET', headers, body, expect } = params ?? ({} as any);
    if (!url) {
      throw new Error('http step requires url');
    }

    let attempt = 0;
    let lastError: unknown;

    while (attempt < MAX_ATTEMPTS) {
      attempt += 1;
      const controller = new AbortController();
      const timeoutMs = DEFAULT_TIMEOUT;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body != null ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (expect?.status && response.status !== expect.status) {
          if (this.shouldRetry(response.status, attempt)) {
            await this.waitBackoff(attempt);
            continue;
          }
          const error = new Error(
            `http expect status ${expect.status}, got ${response.status}`,
          );
          (error as any).retryable = false;
          throw error;
        }

        if (!response.ok && this.shouldRetry(response.status, attempt)) {
          await this.waitBackoff(attempt);
          continue;
        }

        if (!response.ok) {
          const error = new Error(
            `http request failed with status ${response.status}`,
          );
          (error as any).retryable = false;
          throw error;
        }

        const data = await this.parseBody(response);
        return { status: response.status, ok: response.ok, data, attempt };
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;
        const retryable =
          this.isAbortError(error) || (error as any)?.retryable !== false;
        if (retryable && attempt < MAX_ATTEMPTS) {
          await this.waitBackoff(attempt);
          continue;
        }
        throw error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error('http step failed');
  }

  private isAbortError(error: unknown) {
    return (error as any)?.name === 'AbortError';
  }

  private shouldRetry(status: number, attempt: number) {
    return status >= 500 && attempt < MAX_ATTEMPTS;
  }

  private async parseBody(response: Response) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async waitBackoff(attempt: number) {
    const base = 200 * Math.pow(2, attempt - 1);
    const jitter = Math.floor(Math.random() * 100);
    const waitFor = base + jitter;
    await new Promise((resolve) => setTimeout(resolve, waitFor));
  }
}
