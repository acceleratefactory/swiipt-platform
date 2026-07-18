import type { AIProviderAdapter, AIEnrichRequest, AIEnrichResponse } from "./index";
import { buildDefaultPrompt } from "../prompts";

const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL = "qwen-plus";

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

export const qwenProvider: AIProviderAdapter = {
  slug: "qwen",
  name: "Qwen Plus",
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
      return { success: false, enriched: {}, confidence: null, provider: "qwen", model: MODEL, cost: 0 };
    }
    const data = await res.json();
    const { enriched, confidence } = parseResponse(data);
    return {
      success: true,
      enriched,
      confidence,
      provider: "qwen",
      model: MODEL,
      cost: 0,
    };
  },
};
