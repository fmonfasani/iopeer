import axios from 'axios';
import * as fs from 'fs';

export class ElevenLabsService {
  private apiKey = process.env.ELEVEN_API_KEY;
  private voiceId = process.env.ELEVEN_VOICE_ID || 'YOUR_VOICE_ID';

  async generateVoice(text: string): Promise<string> {
    const url = \`https://api.elevenlabs.io/v1/text-to-speech/\${this.voiceId}\`;

    const response = await axios.post(
      url,
      {
        text,
        voice_settings: { stability: 0.4, similarity_boost: 0.8 },
      },
      {
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      },
    );

    const filePath = \`outputs/voice_\${Date.now()}.mp3\`;
    fs.writeFileSync(filePath, response.data);
    return filePath;
  }
}
