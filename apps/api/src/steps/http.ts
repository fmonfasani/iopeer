import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpStep {
  type = 'http';

  async run(params: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    expect?: { status?: number };
  }) {
    const {
      url,
      method = 'GET',
      headers,
      body,
      expect,
    } = params || ({} as any);
    if (!url) throw new Error('http step requires url');

    const res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    // Intentar JSON; si falla, devolver texto
    let data: unknown;
    try {
      data = await res.clone().json();
    } catch {
      data = await res.text();
    }

    if (expect?.status && res.status !== expect.status) {
      throw new Error(`http expect status ${expect.status}, got ${res.status}`);
    }

    return { status: res.status, ok: res.ok, data };
  }
}
