import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { SchedulerService } from './scheduler/scheduler.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const loggerMiddleware = new LoggerMiddleware();
  app.use(loggerMiddleware.use.bind(loggerMiddleware));
  app.enableCors();
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');

  const scheduler = app.get(SchedulerService);
  const interval = Number(process.env.SCHEDULER_INTERVAL_MS ?? 60_000);
  setInterval(() => {
    scheduler
      .tick()
      .catch((error) =>
        // eslint-disable-next-line no-console
        console.error('Scheduler tick failed', error),
      );
  }, interval);

  // eslint-disable-next-line no-console
  console.log(`API up on ${await app.getUrl()}`);
}
bootstrap();
