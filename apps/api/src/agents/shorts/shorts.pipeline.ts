import { GeneratedScript, OpenAIService } from '../../services/openai.service';
import { ElevenLabsService } from '../../services/elevenlabs.service';
import { RunwayService } from '../../services/runway.service';
import { NotionService } from '../../services/notion.service';
import { Logger } from '@nestjs/common';

export interface ShortsPipelineResult {
  script: GeneratedScript;
  voiceFile: string;
  videoFile: string;
}

export class ShortsPipeline {
  private readonly logger = new Logger(ShortsPipeline.name);

  private openai = new OpenAIService();
  private voice = new ElevenLabsService();
  private video = new RunwayService();
  private notion = new NotionService();

  async run(topic: string): Promise<ShortsPipelineResult> {
    this.logger.log(' Generando guion...');
    const script = await this.openai.generateScript(topic);

    this.logger.log('️ Generando voz...');
    const voiceFile = await this.voice.generateVoice(script.text);

    this.logger.log(' Generando video...');
    const videoFile = await this.video.generateVideo(script.title, voiceFile);

    this.logger.log(' Subiendo registro a Notion...');
    await this.notion.uploadRecord(script.title, topic, videoFile);

    this.logger.log('✅ Pipeline completado');
    return { script, voiceFile, videoFile };
  }
}

export default new ShortsPipeline();
