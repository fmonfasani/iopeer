import { Injectable, Logger } from '@nestjs/common';
import { Beautifier } from './beautifier.types';
import { OllamaBeautifier } from './beautifier.ollama.service';
import { HfBeautifier } from './beautifier.hf.service';
import { GroqBeautifier } from './beautifier.groq.service';

@Injectable()
export class BeautifierStrategy {
  private readonly logger = new Logger(BeautifierStrategy.name);

  constructor(
    private readonly ollama: OllamaBeautifier,
    private readonly hf: HfBeautifier,
    private readonly groq: GroqBeautifier,
  ) {}

  private getChain(): Beautifier[] {
    const provider = (process.env.BEAUTIFIER_PROVIDER || 'ollama') as Beautifier['name'];

    // Cadena con fallback: preferido → otros
    const order: Beautifier['name'][] =
      provider === 'groq' ? ['groq', 'hf', 'ollama'] :
      provider === 'hf'   ? ['hf', 'groq', 'ollama'] :
                            ['ollama', 'hf', 'groq'];

    const map: Record<Beautifier['name'], Beautifier> = {
      ollama: this.ollama,
      hf: this.hf,
      groq: this.groq,
    };
    return order.map(k => map[k]);
  }

  async beautify(md: string): Promise<string> {
    const chain = this.getChain();
    let lastErr: any = null;
    for (const b of chain) {
      try {
        this.logger.log(`Beautifier try: ${b.name}`);
        const out = await b.enhance(md);
        if (out && out.trim().length > 0) return out;
      } catch (e: any) {
        lastErr = e;
        this.logger.warn(`Beautifier ${b.name} falló: ${e?.message || e}`);
      }
    }
    this.logger.error('Todos los beautifiers fallaron. Devuelvo el markdown original.');
    if (lastErr) this.logger.error(lastErr?.stack || lastErr);
    return md;
  }
}
