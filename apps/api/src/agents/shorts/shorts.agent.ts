import { ShortsPipeline } from './shorts.pipeline';
import { Logger } from '@nestjs/common';

export class ShortsAgent {
  private readonly logger = new Logger(ShortsAgent.name);
  private readonly pipeline = new ShortsPipeline();

  async run(topic: string) {
    this.logger.log(`í¾¬ Ejecutando agente de shorts para: ${topic}`);
    const result = await this.pipeline.run(topic);
    this.logger.log('âœ… Short generado con Ã©xito');
    return result;
  }
}

export default new ShortsAgent();
