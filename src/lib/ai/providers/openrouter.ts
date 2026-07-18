import type { AIProviderAdapter, AIEnrichRequest, AIEnrichResponse } from "./index";
import { buildDefaultPrompt } from "../prompts";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
// Free OpenRouter models, best-first. Tried in order; a 429/empty on one
// free model falls through to the next (free tiers rate-limit under load).
// Override the whole list with OPENROUTER_MODELS (comma-separated) in Vercel,
// or just the first with OPENROUTER_MODEL.
const DEFAULT_MODELS = [
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder:free",
  "google/gemma-4-31b-it:free",
];

function resolveModels(modelOverride?: string): string[] {
  if (modelOverride) return [modelOverride];
  if (process.env.OPENROUTER_MODELS) {
    return process.env.OPENROUTER_MODELS.split(",").map((m) => m.trim()).filter(Boolean);
  }
  if (process.env.OPENROUTER_MODEL) return [process.env.OPENROUTER_MODEL];
  return DEFAULT_MODELS;
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

export const openrouterProvider: AIProviderAdapter = {
  slug: "openrouter",
  name: "OpenRouter",
  isAvailable(apiKey: string) {
    return !!apiKey;
  },
  async enrich(request: AIEnrichRequest, apiKey: string, modelOverride?: string): Promise<AIEnrichResponse> {
    const baseUrl = process.env.OPENROUTER_URL || DEFAULT_BASE_URL;
    const models = resolveModels(modelOverride);
    let lastModel = models[0];
    for (const model of models) {
      lastModel = model;
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildRequestBody(request, model)),
      });
      if (!res.ok) continue; // try next free model
      const data = await res.json();
      const { enriched, confidence } = parseResponse(data);
      const hasContent = !!(enriched.title || enriched.description || enriched.raw_text);
      if (!hasContent) continue; // try next free model
      return {
        success: true,
        enriched,
        confidence,
        provider: "openrouter",
        model,
        cost: 0,
      };
    }
    return { success: false, enriched: {}, confidence: null, provider: "openrouter", model: lastModel, cost: 0 };
  },
};
