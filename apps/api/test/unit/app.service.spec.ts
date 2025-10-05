import { describe, expect, it } from 'vitest';
import { AppService } from '../../src/app.service';

describe('AppService', () => {
  it('getHello returns greeting', () => {
    const service = new AppService();
    expect(service.getHello()).toBe('Hello World!');
  });
});
