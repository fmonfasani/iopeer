import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { PinoLoggerService, rootLogger } from './logger/pino-logger.service';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

type PinoHttpLoader = () => any;

const defaultPinoHttpLoader: PinoHttpLoader = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('pino-http');
};

export function createHttpLogger(loader: PinoHttpLoader = defaultPinoHttpLoader) {
  try {
    const pinoHttp = loader();
    return pinoHttp({
      logger: rootLogger,
      customProps: (req: any) => ({ requestId: req.requestId }),
    });
  } catch {
    return (req: any, res: any, next: () => void) => {
      const start = Date.now();
      rootLogger.info(
        { requestId: req.requestId, method: req.method, url: req.originalUrl ?? req.url },
        'request:start',
      );
      res.on('finish', () => {
        const durationMs = Date.now() - start;
        rootLogger.info(
          { requestId: req.requestId, statusCode: res.statusCode, durationMs },
          'request:finish',
        );
      });
      next();
    };
  }
}

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);

  const requestIdMiddleware = new RequestIdMiddleware();
  app.use(requestIdMiddleware.use.bind(requestIdMiddleware));
  app.use(createHttpLogger());

  app.enableCors();

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
}

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  bootstrap();
}
