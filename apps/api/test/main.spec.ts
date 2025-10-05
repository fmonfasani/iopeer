import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('creates app and registers middleware', async () => {
    const useMock = vi.fn();
    const useLogger = vi.fn();
    const enableCors = vi.fn();
    const listen = vi.fn();
    const loggerInstance = { log: vi.fn() };

    vi.doMock('../src/logger/pino-logger.service', () => ({
      rootLogger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        child: vi.fn().mockReturnThis(),
      },
      PinoLoggerService: class {
        log = vi.fn();
        error = vi.fn();
        warn = vi.fn();
        debug = vi.fn();
        verbose = vi.fn();
        child = vi.fn();
      },
    }));

    vi.doMock('@nestjs/core', () => ({
      NestFactory: {
        create: vi.fn().mockResolvedValue({
          useLogger,
          use: useMock,
          enableCors,
          listen,
          get: vi.fn().mockReturnValue(loggerInstance),
        }),
      },
    }));

    const { bootstrap } = await import('../src/main');

    await bootstrap();

    const { NestFactory } = await import('@nestjs/core');
    expect(NestFactory.create).toHaveBeenCalled();
    expect(useLogger).toHaveBeenCalledWith(loggerInstance);
    expect(useMock).toHaveBeenCalledTimes(2);
    expect(enableCors).toHaveBeenCalled();
    expect(listen).toHaveBeenCalledWith(3001, '0.0.0.0');
  });

  it('creates http logger fallback when loader fails', async () => {
    const info = vi.fn();

    vi.doMock('../src/logger/pino-logger.service', () => ({
      rootLogger: {
        info,
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        child: vi.fn().mockReturnThis(),
      },
      PinoLoggerService: class {
        log = vi.fn();
        error = vi.fn();
        warn = vi.fn();
        debug = vi.fn();
        verbose = vi.fn();
        child = vi.fn();
      },
    }));

    const { createHttpLogger } = await import('../src/main');

    const middleware = createHttpLogger(() => {
      throw new Error('missing');
    });

    const req: any = { requestId: 'req-1', method: 'GET', url: '/test' };
    const res: any = {
      statusCode: 200,
      on: (event: string, cb: () => void) => {
        if (event === 'finish') {
          cb();
        }
      },
    };
    const next = vi.fn();

    middleware(req, res, next);

    expect(info).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalled();
  });

  it('uses provided pino http loader', async () => {
    vi.doMock('../src/logger/pino-logger.service', () => ({
      rootLogger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        child: vi.fn().mockReturnThis(),
      },
      PinoLoggerService: class {
        log = vi.fn();
        error = vi.fn();
        warn = vi.fn();
        debug = vi.fn();
        verbose = vi.fn();
        child = vi.fn();
      },
    }));

    const { createHttpLogger } = await import('../src/main');
    const middlewareFn = vi.fn();
    const loader = vi.fn().mockReturnValue(() => middlewareFn);
    const middleware = createHttpLogger(() => loader());
    expect(loader).toHaveBeenCalled();
    expect(middleware).toBe(middlewareFn);
  });
});
