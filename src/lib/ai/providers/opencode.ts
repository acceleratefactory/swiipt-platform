import type { AIProviderAdapter, AIEnrichRequest, AIEnrichResponse } from "./index";
import { buildDefaultPrompt } from "../prompts";

const DEFAULT_BASE_URL = "https://opencode.ai/zen/v1";
// Free OpenCode Zen models, best-first. The first is the default; the rest
// are tried in order if a model is rate-limited (free tiers 429 under load).
// Override the whole list with OPENCODE_MODELS (comma-separated) in Vercel,
// or just the first with OPENCODE_MODEL.
const DEFAULT_MODELS = [
  "deepseek-v4-flash-free",
  "mimo-v2.5-free",
  "north-mini-code-free",
  "hy3-free",
];

function resolveModels(modelOverride?: string): string[] {
  if (modelOverride) return [modelOverride];
  if (process.env.OPENCODE_MODELS) {
    return process.env.OPENCODE_MODELS.split(",").map((m) => m.trim()).filter(Boolean);
  }
  if (process.env.OPENCODE_MODEL) return [process.env.OPENCODE_MODEL];
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

export const opencodeProvider: AIProviderAdapter = {
  slug: "opencode",
  name: "OpenCode Zen",
  isAvailable(apiKey: string) {
    return !!apiKey;
  },
  async enrich(request: AIEnrichRequest, apiKey: string, modelOverride?: string): Promise<AIEnrichResponse> {
    const baseUrl = process.env.OPENCODE_URL || DEFAULT_BASE_URL;
    const models = resolveModels(modelOverride);
    let lastModel = models[0];
    let lastErrorBody = "";
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
      if (!res.ok) {
        if (res.status === 429) return { success: false, enriched: {}, confidence: null, provider: "opencode", model, cost: 0, rateLimited: true };
        let body = "";
        try { body = (await res.text()).slice(0, 300); } catch {}
        lastErrorBody = `HTTP ${res.status} ${body}`;
        continue; // try next free model
      }
      const data = await res.json();
      const { enriched, confidence } = parseResponse(data);
      if (!enriched.title && !enriched.description && !enriched.raw_text) {
        // Capture the raw model output so the diagnostic shows what opencode
        // actually returned (error JSON, prose, or empty choices).
        try {
          lastErrorBody = `HTTP 200 empty: ${JSON.stringify(data).slice(0, 400)}`;
        } catch {
          lastErrorBody = "HTTP 200 empty: (unserializable response)";
        }
      }
      // An empty/parsed-empty response is not a usable result — treat as a
      // failure so enrich() falls through to the next provider instead of
      // silently returning nothing (which made translate backfill count every
      // row as failed).
      const hasContent = !!(enriched.title || enriched.description || enriched.raw_text);
      if (!hasContent) continue; // try next free model
      return {
        success: true,
        enriched,
        confidence,
        provider: "opencode",
        model,
        cost: 0,
      };
    }
    return { success: false, enriched: {}, confidence: null, provider: "opencode", model: lastModel, cost: 0, detail: lastErrorBody || "no model in chain returned usable content" };
  },
};
