import type { AIProviderAdapter, AIEnrichRequest, AIEnrichResponse } from "./index";
import { buildDefaultPrompt } from "../prompts";

const BASE_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";
const MODEL = "gemini-2.0-flash";

function buildRequestBody(request: AIEnrichRequest): { contents: { parts: { text: string }[] }[] } {
  const prompt = buildDefaultPrompt(request);
  return {
    contents: [{ parts: [{ text: prompt }] }],
  };
}

function parseResponse(raw: any): { enriched: Record<string, any>; confidence: number | null } {
  const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text || "";
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

export const geminiProvider: AIProviderAdapter = {
  slug: "gemini",
  name: "Gemini 1.5 Flash",
  isAvailable(apiKey: string) {
    return !!apiKey;
  },
  async enrich(request: AIEnrichRequest, apiKey: string): Promise<AIEnrichResponse> {
    const res = await fetch(`${BASE_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestBody(request)),
    });
    if (!res.ok) {
      return { success: false, enriched: {}, confidence: null, provider: "gemini", model: MODEL, cost: 0 };
    }
    const data = await res.json();
    const { enriched, confidence } = parseResponse(data);
    const hasContent = !!(enriched.title || enriched.description || enriched.raw_text);
    if (!hasContent) {
      return { success: false, enriched: { error: "empty response" }, confidence: null, provider: "gemini", model: MODEL, cost: 0 };
    }
    return {
      success: true,
      enriched,
      confidence,
      provider: "gemini",
      model: MODEL,
      cost: 0,
    };
  },
};
