import { Injectable, LoggerService } from '@nestjs/common';

export type LoggerLike = {
  info: (payload: any, message?: string) => void;
  error: (payload: any, message?: string) => void;
  warn: (payload: any, message?: string) => void;
  debug: (payload: any, message?: string) => void;
  trace: (payload: any, message?: string) => void;
  child: (bindings: Record<string, any>) => LoggerLike;
  level?: string;
};

type PinoFactory = (options: Record<string, any>) => LoggerLike;

function resolvePinoFactory(loader: () => any): PinoFactory {
  const mod = loader();
  if (typeof mod === 'function') return mod as PinoFactory;
  if (mod && typeof mod.default === 'function') {
    return mod.default as PinoFactory;
  }
  throw new Error('Invalid pino module export');
}

export function createFallbackLogger(bindings: Record<string, any> = {}): LoggerLike {
  const log = (
    level: 'info' | 'error' | 'warn' | 'debug' | 'trace',
    payload: any,
    message?: string,
  ) => {
    const output =
      payload && typeof payload === 'object'
        ? { ...bindings, ...payload }
        : { ...bindings, msg: payload };
    if (message) {
      output.msg = message;
    }
    const printer =
      level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    printer(output);
  };

  return {
    info(payload: any, message?: string) {
      log('info', payload, message);
    },
    error(payload: any, message?: string) {
      log('error', payload, message);
    },
    warn(payload: any, message?: string) {
      log('warn', payload, message);
    },
    debug(payload: any, message?: string) {
      log('debug', payload, message);
    },
    trace(payload: any, message?: string) {
      log('trace', payload, message);
    },
    child(childBindings: Record<string, any>) {
      return createFallbackLogger({ ...bindings, ...childBindings });
    },
    level: process.env.LOG_LEVEL ?? 'info',
  };
}

function defaultLoader() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('pino');
}

export function createRootLogger(loader: () => any = defaultLoader): LoggerLike {
  try {
    const factory = resolvePinoFactory(loader);
    const options = {
      level: process.env.LOG_LEVEL ?? 'info',
      base: undefined,
    };
    return factory(options);
  } catch {
    return createFallbackLogger();
  }
}

export const rootLogger: LoggerLike = createRootLogger();

@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: LoggerLike = rootLogger;

  log(message: any, ...optionalParams: any[]) {
    this.logger.info(this.toPayload(message, optionalParams));
  }

  error(message: any, ...optionalParams: any[]) {
    this.logger.error(this.toPayload(message, optionalParams));
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(this.toPayload(message, optionalParams));
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(this.toPayload(message, optionalParams));
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logger.trace(this.toPayload(message, optionalParams));
  }

  child(bindings: Record<string, any>): LoggerLike {
    return this.logger.child(bindings);
  }

  private toPayload(message: any, optionalParams: any[]) {
    if (optionalParams.length === 0) {
      return { msg: message };
    }

    if (typeof optionalParams[0] === 'string') {
      return { msg: message, context: optionalParams[0] };
    }

    if (typeof message === 'object') {
      return { ...message, context: optionalParams[0] };
    }

    return { msg: message, ...optionalParams[0] };
  }
}
