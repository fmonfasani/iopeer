import * as fs from 'fs';
import * as path from 'path';

export class ElevenLabsService {
  private apiKey = process.env.ELEVEN_API_KEY;
  private voiceId = process.env.ELEVEN_VOICE_ID || 'YOUR_VOICE_ID';
  private outputDir = 'outputs';

  async generateVoice(text: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ELEVEN_API_KEY environment variable is not defined');
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_settings: { stability: 0.4, similarity_boost: 0.8 },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs request failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.promises.mkdir(this.outputDir, { recursive: true });
    const filePath = path.join(this.outputDir, `voice_${Date.now()}.mp3`);
    await fs.promises.writeFile(filePath, buffer);

    return filePath;
  }
}
