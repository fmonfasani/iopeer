import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { rootLogger, type LoggerLike } from '../logger/pino-logger.service';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    log?: LoggerLike;
  }
}

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

    req.requestId = requestId;
    req.log = rootLogger.child({ requestId });
    res.setHeader('x-request-id', requestId);

    next();
  }
}
