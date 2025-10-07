import { Controller, Post, Body } from '@nestjs/common';
import ShortsAgent from '../agents/shorts/shorts.agent';
import { ShortsPipelineResult } from '../agents/shorts/shorts.pipeline';

interface RunShortResponse {
  ok: true;
  data: ShortsPipelineResult;
}

@Controller('shorts')
export class ShortsController {
  @Post('run')
  async runShort(@Body() body: { topic: string }): Promise<RunShortResponse> {
    const result = await ShortsAgent.run(body.topic);
    return { ok: true, data: result };
  }
}
