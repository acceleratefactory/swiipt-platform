import type { AIProviderAdapter, AIEnrichRequest, AIEnrichResponse } from "./index";
import { buildDefaultPrompt } from "../prompts";

const DEFAULT_BASE_URL = "https://opencode.ai/zen/v1";
// Model is env-overridable so the exact free slug can be set in Vercel
// without a code deploy. Default is a known-valid OpenCode free model.
const MODEL = process.env.OPENCODE_MODEL || "deepseek/deepseek-v3:free";

function buildRequestBody(request: AIEnrichRequest): any {
  const prompt = buildDefaultPrompt(request);
  return {
    model: MODEL,
    max_tokens: 2000,
    stream: false,
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

export const opencodeProvider: AIProviderAdapter = {
  slug: "opencode",
  name: "OpenCode Zen",
  isAvailable(apiKey: string) {
    return !!apiKey;
  },
  async enrich(request: AIEnrichRequest, apiKey: string): Promise<AIEnrichResponse> {
    const baseUrl = process.env.OPENCODE_URL || DEFAULT_BASE_URL;
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(request)),
    });
    if (!res.ok) {
      return { success: false, enriched: {}, confidence: null, provider: "opencode", model: MODEL, cost: 0 };
    }
    const data = await res.json();
    const { enriched, confidence } = parseResponse(data);
    // An empty/parsed-empty response is not a usable result — treat as a
    // failure so enrich() falls through to the next provider instead of
    // silently returning nothing (which made translate backfill count every
    // row as failed).
    const hasContent = !!(enriched.title || enriched.description || enriched.raw_text);
    if (!hasContent) {
      return { success: false, enriched: { error: "empty response" }, confidence: null, provider: "opencode", model: MODEL, cost: 0 };
    }
    return {
      success: true,
      enriched,
      confidence,
      provider: "opencode",
      model: MODEL,
      cost: 0,
    };
  },
};
