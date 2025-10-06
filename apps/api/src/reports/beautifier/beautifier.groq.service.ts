import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { Beautifier, wrapPrompt } from './beautifier.types';

@Injectable()
export class GroqBeautifier implements Beautifier {
  name: 'groq' = 'groq';
  private readonly logger = new Logger(GroqBeautifier.name);
  private readonly client = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  private readonly model = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';

  async enhance(markdown: string): Promise<string> {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY falta');

    const chat = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'Eres un analista técnico y PM que sintetiza reportes claros.' },
        { role: 'user', content: wrapPrompt(markdown) },
      ],
      temperature: 0.3,
    });

    const out = chat.choices?.[0]?.message?.content || '';
    return (out || '').trim() || markdown;
  }
}
