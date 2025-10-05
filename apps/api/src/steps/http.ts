import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpStep {
  type = 'http';

  async run(params: any) {
    const { url, method = 'GET', headers, body, expect } = params || {};
    if (!url) throw new Error('http step requires url');

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let data: any;
    try {
      data = await res.json();
    } catch {
      try {
        data = await res.text();
      } catch {
        data = undefined;
      }
    }

    if (expect?.status && res.status !== expect.status) {
      throw new Error(`http expect status ${expect.status}, got ${res.status}`);
    }

    return { status: res.status, data };
  }
}
