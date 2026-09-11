import { AIProvider } from "../types";

// ─── Provider Adapters ────────────────────────────────────────────────────────

export interface ProviderRequest {
  prompt: string;
  systemPrompt: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface ProviderResponse {
  content: string;
  tokensUsed?: number;
}

/**
 * Build the fetch request for each provider.
 * Returns { url, options } ready for fetch().
 */
export function buildProviderRequest(
  provider: AIProvider,
  req: ProviderRequest
): { url: string; options: RequestInit } {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  switch (provider) {
    case "openai":
    case "openai-compatible": {
      const baseUrl = req.baseUrl?.replace(/\/$/, "") || "https://api.openai.com/v1";
      headers["Authorization"] = `Bearer ${req.apiKey}`;
      return {
        url: `${baseUrl}/chat/completions`,
        options: {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: req.model || "gpt-4o-mini",
            messages: [
              { role: "system", content: req.systemPrompt },
              { role: "user", content: req.prompt },
            ],
            max_tokens: 2000,
            temperature: 0.3,
          }),
        },
      };
    }

    case "anthropic": {
      headers["x-api-key"] = req.apiKey;
      headers["anthropic-version"] = "2023-06-01";
      return {
        url: "https://api.anthropic.com/v1/messages",
        options: {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: req.model || "claude-3-5-haiku-20241022",
            system: req.systemPrompt,
            messages: [{ role: "user", content: req.prompt }],
            max_tokens: 2000,
          }),
        },
      };
    }

    case "gemini": {
      const model = req.model || "gemini-1.5-flash";
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${req.apiKey}`,
        options: {
          method: "POST",
          headers,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: req.systemPrompt }] },
            contents: [{ parts: [{ text: req.prompt }] }],
            generationConfig: { maxOutputTokens: 2000, temperature: 0.3 },
          }),
        },
      };
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Parse the provider response body into a string.
 */
export function parseProviderResponse(provider: AIProvider, body: unknown): string {
  const b = body as Record<string, unknown>;

  switch (provider) {
    case "openai":
    case "openai-compatible": {
      const choices = b.choices as Array<{ message: { content: string } }>;
      return choices?.[0]?.message?.content ?? "";
    }

    case "anthropic": {
      const content = b.content as Array<{ type: string; text: string }>;
      return content?.[0]?.text ?? "";
    }

    case "gemini": {
      const candidates = b.candidates as Array<{
        content: { parts: Array<{ text: string }> };
      }>;
      return candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }

    default:
      return "";
  }
}

// ─── Provider default models ──────────────────────────────────────────────────

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  gemini: "gemini-1.5-flash",
  "openai-compatible": "gpt-4o-mini",
};

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  "openai-compatible": "OpenAI-compatible",
};

// ─── Retryable HTTP status codes ──────────────────────────────────────────────

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

export function isAuthFailureStatus(status: number): boolean {
  return status === 401 || status === 403;
}
