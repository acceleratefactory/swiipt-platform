import type { AIProviderAdapter, AIEnrichRequest, AIEnrichResponse } from "./index";
import { buildDefaultPrompt } from "../prompts";

const BASE_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";

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

export const deepseekProvider: AIProviderAdapter = {
  slug: "deepseek",
  name: "DeepSeek Chat",
  isAvailable(apiKey: string) {
    return !!apiKey;
  },
  async enrich(request: AIEnrichRequest, apiKey: string): Promise<AIEnrichResponse> {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(request)),
    });
    if (!res.ok) {
      return { success: false, enriched: {}, confidence: null, provider: "deepseek", model: MODEL, cost: 0 };
    }
    const data = await res.json();
    const { enriched, confidence } = parseResponse(data);
    return {
      success: true,
      enriched,
      confidence,
      provider: "deepseek",
      model: MODEL,
      cost: 0,
    };
  },
};
