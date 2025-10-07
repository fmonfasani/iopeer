import { Injectable, Logger } from '@nestjs/common';

type TextContentBlock = {
  type: 'text';
  text: { value: string };
};

type ThreadMessage = {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: Array<TextContentBlock | Record<string, unknown>>;
};

type RunStatus =
  | 'queued'
  | 'in_progress'
  | 'requires_action'
  | 'cancelling'
  | 'cancelled'
  | 'failed'
  | 'expired'
  | 'completed';

type ThreadRun = {
  id: string;
  thread_id: string;
  status: RunStatus;
};

type CreateAndRunResponse = ThreadRun;

type RunRetrieveResponse = ThreadRun;

type MessagesListResponse = {
  data: ThreadMessage[];
};

@Injectable()
export class OpenAIReporterService {
  private readonly logger = new Logger(OpenAIReporterService.name);
  private readonly apiKey = process.env.OPENAI_API_KEY;
  private readonly assistantId = process.env.OPENAI_ASSISTANT_ID;
  private readonly apiUrl = 'https://api.openai.com/v1';

  isEnabled(): boolean {
    return Boolean(this.apiKey && this.assistantId);
  }

  async generateSummary(reportText: string): Promise<string> {
    if (!this.apiKey || !this.assistantId) {
      throw new Error('OpenAI reporter is not configured.');
    }

    const prompt = this.buildPrompt(reportText);

    const run = await this.createAndRun(prompt);
    const completed = await this.waitForCompletion(run.thread_id, run.id);

    if (completed.status !== 'completed') {
      throw new Error(`OpenAI run finished with status "${completed.status}"`);
    }

    const message = await this.getLatestAssistantMessage(completed.thread_id);
    if (!message) {
      throw new Error('OpenAI did not return any assistant messages.');
    }

    return message;
  }

  private buildPrompt(reportText: string): string {
    return [
      'Sos un analista senior de operaciones. Analizá el siguiente reporte de estado de forma concisa.',
      'Devolveme un resumen en español con bullets de insights accionables y alertas críticas.',
      'Si no encontrás información suficiente, explicitá que faltan datos.',
      '',
      reportText,
    ].join('\n');
  }

  private async createAndRun(prompt: string): Promise<CreateAndRunResponse> {
    return this.request<CreateAndRunResponse>('POST', '/threads/runs', {
      assistant_id: this.assistantId,
      thread: {
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
    });
  }

  private async waitForCompletion(threadId: string, runId: string): Promise<RunRetrieveResponse> {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      attempts += 1;
      const run = await this.request<RunRetrieveResponse>('GET', `/threads/${threadId}/runs/${runId}`);

      if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
        return run;
      }

      await this.delay(Math.min(2000, attempts * 200));
    }

    throw new Error('Timeout waiting for OpenAI run to finish.');
  }

  private async getLatestAssistantMessage(threadId: string): Promise<string | undefined> {
    const messages = await this.request<MessagesListResponse>(
      'GET',
      `/threads/${threadId}/messages?order=desc&limit=20`,
    );

    for (const message of messages.data ?? []) {
      if (message.role !== 'assistant') {
        continue;
      }

      for (const block of message.content ?? []) {
        if (this.isTextBlock(block)) {
          return block.text.value.trim();
        }
      }
    }

    return undefined;
  }

  private isTextBlock(block: ThreadMessage['content'][number]): block is TextContentBlock {
    return (
      typeof block === 'object' &&
      block != null &&
      'type' in block &&
      (block as Record<string, unknown>).type === 'text' &&
      'text' in block &&
      typeof (block as { text?: { value?: unknown } }).text?.value === 'string'
    );
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Missing OpenAI API key.');
    }

    const response = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`OpenAI request failed (${response.status} ${response.statusText}): ${errorBody}`);
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
