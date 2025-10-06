import { Injectable, Logger } from '@nestjs/common';
import { Beautifier, wrapPrompt } from './beautifier.types';

@Injectable()
export class HfBeautifier implements Beautifier {
  name: 'hf' = 'hf';
  private readonly logger = new Logger(HfBeautifier.name);
  private url = process.env.HF_API_URL || '';
  private token = process.env.HF_API_TOKEN || '';

  async enhance(markdown: string): Promise<string> {
    if (!this.url || !this.token) throw new Error('HF_API_URL/HF_API_TOKEN faltan');

    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: wrapPrompt(markdown),
        parameters: { max_new_tokens: 600, temperature: 0.4 },
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`HF HTTP ${res.status}: ${t}`);
    }

    const data = await res.json();
    // Algunas APIs devuelven {generated_text}, otras un array
    const out = Array.isArray(data) ? data[0]?.generated_text : (data?.generated_text || data);
    const text = typeof out === 'string' ? out : JSON.stringify(out);
    return text.trim() || markdown;
  }
}
