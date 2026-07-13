import type { AIProviderAdapter, AIEnrichRequest, AIEnrichResponse } from "./index";
import { buildDefaultPrompt } from "../prompts";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "openai/gpt-4o-mini";

function buildRequestBody(request: AIEnrichRequest): any {
  const prompt = buildDefaultPrompt(request);
  return {
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  };
}

function parseResponse(raw: any): { enriched: Record<string, any>; confidence: number | null } {
  const text = raw?.choices?.[0]?.message?.content || "";
  try {
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      enriched: parsed,
      confidence: parsed.confidence_score ?? null,
    };
  } catch {
    return { enriched: { raw_text: text }, confidence: null };
  }
}

export const openrouterProvider: AIProviderAdapter = {
  slug: "openrouter",
  name: "OpenRouter",
  isAvailable(apiKey: string) {
    return !!apiKey;
  },
  async enrich(request: AIEnrichRequest, apiKey: string): Promise<AIEnrichResponse> {
    const baseUrl = process.env.OPENROUTER_URL || DEFAULT_BASE_URL;
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(request)),
    });
    if (!res.ok) {
      return { success: false, enriched: {}, confidence: null, provider: "openrouter", model: MODEL, cost: 0 };
    }
    const data = await res.json();
    const { enriched, confidence } = parseResponse(data);
    return {
      success: true,
      enriched,
      confidence,
      provider: "openrouter",
      model: MODEL,
      cost: 0,
    };
  },
};
