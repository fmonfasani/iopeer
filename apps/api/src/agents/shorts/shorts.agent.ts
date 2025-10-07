import { ShortsPipeline, ShortsPipelineResult } from './shorts.pipeline';
import { Logger } from '@nestjs/common';

export class ShortsAgent {
  private readonly logger = new Logger(ShortsAgent.name);
  private readonly pipeline = new ShortsPipeline();

  async run(topic: string): Promise<ShortsPipelineResult> {
    this.logger.log(` Ejecutando agente de shorts para: ${topic}`);
    const result = await this.pipeline.run(topic);
    this.logger.log('✅ Short generado con éxito');
    return result;
  }
}

export default new ShortsAgent();
