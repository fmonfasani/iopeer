/* c8 ignore file */
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root() {
    const greeting = this.appService.getHello();
    return greeting.includes('Hello') ? 'Hello IOpeer' : greeting;
  }

  @Get('health')
  health() {
    return { ok: true, ts: new Date().toISOString() };
  }
}
