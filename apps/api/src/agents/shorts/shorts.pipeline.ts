import { OpenAIService } from '../../services/openai.service';
import { ElevenLabsService } from '../../services/elevenlabs.service';
import { RunwayService } from '../../services/runway.service';
import { NotionService } from '../../services/notion.service';
import { Logger } from '@nestjs/common';

export class ShortsPipeline {
  private readonly logger = new Logger(ShortsPipeline.name);

  private openai = new OpenAIService();
  private voice = new ElevenLabsService();
  private video = new RunwayService();
  private notion = new NotionService();

  async run(topic: string) {
    this.logger.log('Ì∑† Generando guion...');
    const script = await this.openai.generateScript(topic);

    this.logger.log('ÌæôÔ∏è Generando voz...');
    const voiceFile = await this.voice.generateVoice(script.text);

    this.logger.log('Ìæ• Generando video...');
    const videoFile = await this.video.generateVideo(script.title, voiceFile);

    this.logger.log('Ì≥ä Subiendo registro a Notion...');
    await this.notion.uploadRecord(script.title, topic, videoFile);

    this.logger.log('‚úÖ Pipeline completado');
    return { script, voiceFile, videoFile };
  }
}

export default new ShortsPipeline();
