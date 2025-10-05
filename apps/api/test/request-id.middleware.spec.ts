import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Response } from 'express';

import { RequestIdMiddleware } from '../src/middleware/request-id.middleware';
import { rootLogger } from '../src/logger/pino-logger.service';

function createRes() {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    setHeader: vi.fn(),
    on: vi.fn((event: string, handler: () => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(handler);
    }),
    emit(event: string) {
      listeners[event]?.forEach((handler) => handler());
    },
  } as unknown as Response & { emit: (event: string) => void };
}

describe('RequestIdMiddleware', () => {
  it('uses existing header request id', () => {
    const middleware = new RequestIdMiddleware();
    const req: any = { headers: { 'x-request-id': 'abc-123' } };
    const res = createRes();
    const next: NextFunction = vi.fn();
    const childSpy = vi.spyOn(rootLogger, 'child');

    middleware.use(req, res, next);

    expect(req.requestId).toBe('abc-123');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'abc-123');
    expect(next).toHaveBeenCalled();
    expect(childSpy).toHaveBeenCalledWith({ requestId: 'abc-123' });
    childSpy.mockRestore();
  });

  it('generates id when missing', () => {
    const middleware = new RequestIdMiddleware();
    const req: any = { headers: {} };
    const res = createRes();
    const next: NextFunction = vi.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);
    expect(next).toHaveBeenCalled();
  });

  it('supports array header values', () => {
    const middleware = new RequestIdMiddleware();
    const req: any = { headers: { 'x-request-id': ['one', 'two'] } };
    const res = createRes();
    const next: NextFunction = vi.fn();

    middleware.use(req, res, next);

    expect(req.requestId).toBe('one');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'one');
    expect(next).toHaveBeenCalled();
  });
});
