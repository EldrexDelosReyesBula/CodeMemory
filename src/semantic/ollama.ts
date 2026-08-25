import http from 'node:http';

export interface OllamaOptions {
  baseUrl?: string;
  model?: string;
}

export class OllamaSemanticClient {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: OllamaOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.model = options.model || 'llama3.2';
  }

  /**
   * Check if local Ollama daemon is reachable.
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const url = new URL('/api/tags', this.baseUrl);
      const res = await fetch(url.toString(), { method: 'GET', signal: AbortSignal.timeout(1000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate concise semantic summary for a code symbol or component.
   */
  public async summarizeCode(codeSnippet: string, maxTokens: number = 100): Promise<string | null> {
    try {
      const url = new URL('/api/generate', this.baseUrl);
      const prompt = `Summarize the following code component in 1-2 concise sentences focusing on its purpose and responsibilities:\n\n${codeSnippet}`;

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            num_predict: maxTokens,
          },
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;
      const data = (await response.json()) as { response?: string };
      return data.response ? data.response.trim() : null;
    } catch {
      return null;
    }
  }
}
