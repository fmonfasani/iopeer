import { Injectable, Logger } from '@nestjs/common';

interface GithubRequestOptions extends RequestInit {
  readonly expectJson?: boolean;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly baseUrl = 'https://api.github.com';

  private resolveUrl(path: string): string {
    if (/^https?:/i.test(path)) {
      return path;
    }

    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private buildHeaders(init?: RequestInit): Headers {
    const headers = new Headers(init?.headers ?? {});

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/vnd.github+json');
    }

    if (!headers.has('User-Agent')) {
      headers.set('User-Agent', 'iopeer-api');
    }

    const token = process.env.GITHUB_TOKEN ?? process.env.GITHUB_ACCESS_TOKEN;
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  async request<T = unknown>(path: string, options: GithubRequestOptions = {}): Promise<T> {
    const url = this.resolveUrl(path);
    const { expectJson = true, ...init } = options;
    const headers = this.buildHeaders(init);

    const response = await fetch(url, { ...init, headers });

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(`GitHub request failed (${response.status} ${response.statusText}) ${url}`);
      throw new Error(`GitHub request failed (${response.status}): ${body || 'empty body'}`);
    }

    if (!expectJson) {
      return undefined as T;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (text.length === 0) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      this.logger.warn(`Unable to parse GitHub response as JSON for ${url}`);
      throw error;
    }
  }
}
