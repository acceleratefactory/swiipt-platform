import type { AIProviderAdapter, AIEnrichRequest, AIEnrichResponse } from "./index";
import { buildDefaultPrompt } from "../prompts";

const DEFAULT_BASE_URL = "https://api.aiand.com/v1";
const DEFAULT_MODEL = "Qwen3.6-27B";

function resolveModel(modelOverride?: string): string {
  if (modelOverride) return modelOverride;
  if (process.env.AIAND_MODEL) return process.env.AIAND_MODEL;
  return DEFAULT_MODEL;
}

function buildRequestBody(request: AIEnrichRequest, model: string): any {
  const prompt = buildDefaultPrompt(request);
  return {
    model,
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

export const aiandProvider: AIProviderAdapter = {
  slug: "aiand",
  name: "AIAND (Qwen3.6-27B free)",
  isAvailable(apiKey: string) {
    return !!apiKey;
  },
  async enrich(request: AIEnrichRequest, apiKey: string, modelOverride?: string): Promise<AIEnrichResponse> {
    const baseUrl = process.env.AIAND_URL || DEFAULT_BASE_URL;
    const model = resolveModel(modelOverride);
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(request, model)),
    });
    if (!res.ok) {
      if (res.status === 429) {
        return { success: false, enriched: {}, confidence: null, provider: "aiand", model, cost: 0, rateLimited: true };
      }
      return { success: false, enriched: {}, confidence: null, provider: "aiand", model, cost: 0 };
    }
    const data = await res.json();
    const { enriched, confidence } = parseResponse(data);
    const hasContent = !!(enriched.title || enriched.description || enriched.raw_text);
    if (!hasContent) {
      return { success: false, enriched: {}, confidence: null, provider: "aiand", model, cost: 0 };
    }
    return {
      success: true,
      enriched,
      confidence,
      provider: "aiand",
      model,
      cost: 0,
    };
  },
};
