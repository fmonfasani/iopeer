import { Injectable } from "@nestjs/common";
import { OpenAIService } from "../services/openai.service";

export interface ProjectReport {
  title: string;
  summary: string;
  generatedAt: string;
}

@Injectable()
export class OpenAIReporterService {
  private readonly openai = new OpenAIService();

  async generateReport(): Promise<ProjectReport> {
    const prompt = "Genera un reporte actualizado del estado general del proyecto IOpeer.";
    const summary = await this.openai.chat(prompt);

    return {
      title: "Reporte del estado del proyecto IOpeer",
      summary,
      generatedAt: new Date().toISOString(),
    };
  }
}
