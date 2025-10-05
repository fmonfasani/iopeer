import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class HttpStep {
  type = 'http';
  async run(params: any) {
    const { url, method = 'GET', headers, body, expect } = params || {};
    if (!url) throw new Error('http step requires url');
    const res = await axios.request({
      url,
      method,
      headers,
      data: body,
      validateStatus: () => true,
    });
    if (expect?.status && res.status !== expect.status) {
      throw new Error(`http expect status ${expect.status}, got ${res.status}`);
    }
    return { status: res.status, data: res.data };
  }
}
