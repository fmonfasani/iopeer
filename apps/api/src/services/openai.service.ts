import { Injectable } from "@nestjs/common";

export interface GeneratedScript {
  title: string;
  text: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

@Injectable()
export class OpenAIService {
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly model = "gpt-4o-mini";

  async chat(prompt: string): Promise<string> {
    const response = await this.createChatCompletion([
      { role: "user", content: prompt },
    ]);

    return response ?? `Respuesta generada para: ${prompt}`;
  }

  async generateScript(topic: string): Promise<GeneratedScript> {
    const prompt = `Crea un guion breve y atractivo para un video corto sobre "${topic}". Devuelve un titulo llamativo en la primera linea y el resto del texto como cuerpo del guion.`;

    const response = await this.createChatCompletion([
      { role: "system", content: "Eres un guionista creativo de videos cortos." },
      { role: "user", content: prompt },
    ]);

    const content = response ?? `Short sobre ${topic}\nIntroducción: Explica brevemente por qué ${topic} es relevante hoy.\nDesarrollo: Describe dos ideas principales de forma clara y entusiasta.\nCierre: Invita a la audiencia a seguir aprendiendo sobre ${topic}.`;
    const [firstLine, ...rest] = content.split("\n");

    return {
      title: firstLine?.trim() || `Short sobre ${topic}`,
      text: rest.join("\n").trim() || content.trim(),
    };
  }

  private async createChatCompletion(messages: ChatMessage[]): Promise<string | undefined> {
    if (!this.apiKey) {
      return undefined;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content ?? undefined;
  }
}
