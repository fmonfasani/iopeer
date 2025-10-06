import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

type PrismaBeforeExitEvent = Parameters<PrismaClient['$on']>[0] extends never
  ? 'beforeExit'
  : Extract<Parameters<PrismaClient['$on']>[0], 'beforeExit'>;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit' as PrismaBeforeExitEvent, async () => {
      await app.close();
    });
  }
}
