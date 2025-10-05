import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createFallbackLogger,
  createRootLogger,
  PinoLoggerService,
  rootLogger,
} from '../src/logger/pino-logger.service';

function createFakeConsole() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };
}

describe('pino logger service', () => {
  const originalConsole = { ...console };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  it('creates fallback logger and logs payloads', () => {
    const fake = createFakeConsole();
    console.log = fake.log;
    console.error = fake.error;
    console.warn = fake.warn;

    const logger = createFallbackLogger({ requestId: 'req-1' });
    logger.info({ msg: 'hello' });
    logger.error({ err: 'boom' }, 'error');
    const child = logger.child({ runId: 'run-1' });
    child.warn('warn');

    expect(fake.log).toHaveBeenCalled();
    expect(fake.error).toHaveBeenCalled();
    expect(fake.warn).toHaveBeenCalled();
  });

  it('creates root logger using loader function', () => {
    const factory = vi.fn().mockReturnValue({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn(),
      child: vi.fn().mockReturnThis(),
    });

    const logger = createRootLogger(() => factory);
    expect(factory).toHaveBeenCalledWith(
      expect.objectContaining({ level: expect.any(String), base: undefined }),
    );
    expect(logger.child).toBeTypeOf('function');
  });

  it('falls back to console when loader throws', () => {
    const logger = createRootLogger(() => {
      throw new Error('missing');
    });
    expect(logger.child).toBeTypeOf('function');
  });

  it('PinoLoggerService proxies to root logger', () => {
    const info = vi.spyOn(rootLogger, 'info').mockImplementation(() => undefined);
    const error = vi.spyOn(rootLogger, 'error').mockImplementation(() => undefined);
    const warn = vi.spyOn(rootLogger, 'warn').mockImplementation(() => undefined);
    const debug = vi.spyOn(rootLogger, 'debug').mockImplementation(() => undefined);
    const trace = vi.spyOn(rootLogger, 'trace').mockImplementation(() => undefined);
    const child = vi.spyOn(rootLogger, 'child').mockReturnValue(rootLogger);

    const service = new PinoLoggerService();
    service.log('msg');
    service.error('err');
    service.warn('warn');
    service.debug('debug');
    service.verbose('verbose');
    service.child({});

    expect(info).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    expect(debug).toHaveBeenCalled();
    expect(trace).toHaveBeenCalled();
    expect(child).toHaveBeenCalled();

    info.mockRestore();
    error.mockRestore();
    warn.mockRestore();
    debug.mockRestore();
    trace.mockRestore();
    child.mockRestore();
  });
});
