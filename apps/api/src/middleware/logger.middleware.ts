import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = pino({
    level: process.env.LOG_LEVEL ?? 'info',
  });

  private readonly httpLogger = pinoHttp({
    logger: this.logger,
    genReqId: (req, res) => {
      const existing = req.headers['x-request-id'];
      if (typeof existing === 'string' && existing.length > 0) {
        res.setHeader('x-request-id', existing);
        return existing;
      }
      const id = randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
    customSuccessMessage: (req, res) =>
      `request:complete ${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
      `request:error ${req.method} ${req.url} ${res.statusCode} ${err?.message ?? ''}`,
  });

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    this.logger.info(
      {
        requestId,
        method: req.method,
        url: req.originalUrl ?? req.url,
      },
      'request:start',
    );

    this.httpLogger(req, res);

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      this.logger.info(
        {
          requestId,
          statusCode: res.statusCode,
          durationMs,
        },
        'request:finish',
      );
    });

    next();
  }
}
