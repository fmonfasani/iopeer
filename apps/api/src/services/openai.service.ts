import { Injectable } from "@nestjs/common";
import OpenAI from "openai";

@Injectable()
export class OpenAIService {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async chat(prompt: string) {
    const res = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    return res.choices[0].message.content;
  }
}
