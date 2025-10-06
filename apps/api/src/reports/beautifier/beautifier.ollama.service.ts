import { Injectable, Logger } from '@nestjs/common';
import { Beautifier, wrapPrompt } from './beautifier.types';

@Injectable()
export class OllamaBeautifier implements Beautifier {
  name: 'ollama' = 'ollama';
  private readonly logger = new Logger(OllamaBeautifier.name);
  private baseUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  private model = process.env.OLLAMA_MODEL || 'deepseek-coder:latest';

  async enhance(markdown: string): Promise<string> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: 'Eres un analista técnico y PM experimentado.' },
        { role: 'user', content: wrapPrompt(markdown) },
      ],
      stream: false,
    };

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Ollama HTTP ${res.status}: ${t}`);
    }
    const json = await res.json();
    const out = json?.message?.content || '';
    return out.trim() || markdown;
    }
}
