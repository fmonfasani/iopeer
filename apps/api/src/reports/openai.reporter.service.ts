import OpenAI from "openai";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OpenAIReporterService {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async generateReport() {
    const run = await this.client.beta.threads.createAndRun({
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      thread: {
        messages: [
          { role: "user", content: "Genera un reporte actualizado del estado general del proyecto IOpeer." },
        ],
      },
    });

    const result = await this.client.beta.threads.runs.retrieve(
      run.thread_id,
      run.id
    );

    return result;
  }
}
