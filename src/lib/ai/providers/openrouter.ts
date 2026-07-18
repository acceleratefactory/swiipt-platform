import type { AIProviderAdapter, AIEnrichRequest, AIEnrichResponse } from "./index";
import { buildDefaultPrompt } from "../prompts";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
// Model is env-overridable so the exact free slug (must include ":free")
// can be set in Vercel without a code deploy.
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini:free";

function buildRequestBody(request: AIEnrichRequest, modelOverride?: string): any {
  const prompt = buildDefaultPrompt(request);
  return {
    model: modelOverride || MODEL,
    max_tokens: 2000,
    stream: false,
    messages: [{ role: "user", content: prompt }],
  };
}

function parseResponse(raw: any): { enriched: Record<string, any>; confidence: number | null } {
  const text = raw?.choices?.[0]?.message?.content || "";
  try {
    const cleanedText = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleanedText);
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
  async enrich(request: AIEnrichRequest, apiKey: string, modelOverride?: string): Promise<AIEnrichResponse> {
    const baseUrl = process.env.OPENROUTER_URL || DEFAULT_BASE_URL;
    const model = modelOverride || MODEL;
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(request, modelOverride)),
    });
    if (!res.ok) {
      return { success: false, enriched: {}, confidence: null, provider: "openrouter", model, cost: 0 };
    }
    const data = await res.json();
    const { enriched, confidence } = parseResponse(data);
    return {
      success: true,
      enriched,
      confidence,
      provider: "openrouter",
      model,
      cost: 0,
    };
  },
};
