import { AIKeySlot } from "../types";
import {
  buildProviderRequest,
  parseProviderResponse,
  isRetryableStatus,
  isAuthFailureStatus,
} from "./providers";

export interface FailoverRequest {
  keys: AIKeySlot[];
  prompt: string;
  systemPrompt: string;
}

export interface FailoverResult {
  success: boolean;
  content?: string;
  error?: string;
  usedKeyId?: string;
  keyStatusUpdates?: Array<{ id: string; status: AIKeySlot["status"]; lastError?: string }>;
}

const TIMEOUT_MS = 30000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Try each enabled key in priority order.
 * Returns the first successful response or a composite error.
 */
export async function runWithFailover(req: FailoverRequest): Promise<FailoverResult> {
  const enabledKeys = req.keys
    .filter((k) => k.enabled && k.status !== "disabled" && k.status !== "invalid")
    .sort((a, b) => a.priority - b.priority);

  if (enabledKeys.length === 0) {
    return {
      success: false,
      error: "No enabled AI keys configured. Please add an API key in Settings → AI Review.",
    };
  }

  const statusUpdates: FailoverResult["keyStatusUpdates"] = [];
  const errors: string[] = [];

  for (const key of enabledKeys) {
    try {
      const { url, options } = buildProviderRequest(key.provider, {
        prompt: req.prompt,
        systemPrompt: req.systemPrompt,
        model: key.model,
        apiKey: key.apiKey,
        baseUrl: key.baseUrl,
      });

      const response = await fetchWithTimeout(url, options);

      if (response.ok) {
        const body = await response.json();
        const content = parseProviderResponse(key.provider, body);
        if (content) {
          statusUpdates.push({ id: key.id, status: "active" });
          return {
            success: true,
            content,
            usedKeyId: key.id,
            keyStatusUpdates: statusUpdates,
          };
        }
        errors.push(`Key ${key.id}: empty response`);
        continue;
      }

      if (isAuthFailureStatus(response.status)) {
        // Mark as invalid, don't retry
        statusUpdates.push({
          id: key.id,
          status: "invalid",
          lastError: `HTTP ${response.status}: Authentication failed`,
        });
        errors.push(`Key ${key.id}: authentication failed (${response.status})`);
        continue;
      }

      if (isRetryableStatus(response.status)) {
        const newStatus = response.status === 429 ? "rate-limited" : "cooldown";
        statusUpdates.push({
          id: key.id,
          status: newStatus,
          lastError: `HTTP ${response.status}`,
        });
        errors.push(`Key ${key.id}: ${response.status} — trying next key`);
        continue;
      }

      // Other non-OK status
      errors.push(`Key ${key.id}: HTTP ${response.status}`);
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      const msg = isTimeout ? "timeout" : err instanceof Error ? err.message : "network error";
      statusUpdates.push({ id: key.id, status: "cooldown", lastError: msg });
      errors.push(`Key ${key.id}: ${msg} — trying next key`);
    }
  }

  return {
    success: false,
    error:
      errors.length > 0
        ? `All AI keys failed. Errors: ${errors.join("; ")}`
        : "All AI keys exhausted.",
    keyStatusUpdates: statusUpdates,
  };
}
