import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

import { rootLogger, type LoggerLike } from '../logger/pino-logger.service';

type RequestWithLogger = Request & {
  requestId?: string;
  log?: LoggerLike;
};

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerId = req.headers['x-request-id'];
    const requestId =
      typeof headerId === 'string' && headerId.trim().length > 0
        ? headerId
        : Array.isArray(headerId) && headerId.length > 0
          ? headerId[0]
          : randomUUID();

    const requestWithLogger = req as RequestWithLogger;
    requestWithLogger.requestId = requestId;
    requestWithLogger.log = rootLogger.child({ requestId });
    res.setHeader('x-request-id', requestId);

    next();
  }
}
