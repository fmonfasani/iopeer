import { Controller, Post, Body } from '@nestjs/common';
import ShortsAgent from '../agents/shorts/shorts.agent';

@Controller('shorts')
export class ShortsController {
  @Post('run')
  async runShort(@Body() body: { topic: string }) {
    const result = await ShortsAgent.run(body.topic);
    return { ok: true, data: result };
  }
}
