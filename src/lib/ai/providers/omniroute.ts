import type { AIProviderAdapter, AIEnrichRequest, AIEnrichResponse } from "./index";
import { buildDefaultPrompt } from "../prompts";

const MODEL = "auto/best-fast";

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

export const omnirouteProvider: AIProviderAdapter = {
  slug: "omniroute",
  name: "OmniRoute",
  isAvailable(apiKey: string) {
    return !!apiKey;
  },
  async enrich(request: AIEnrichRequest, apiKey: string): Promise<AIEnrichResponse> {
    // Require an explicit OMMIROUTE_URL — the old localhost default made
    // every call fail with a silent "fetch failed".
    const baseUrl = process.env.OMNIROUTE_URL;
    if (!baseUrl) {
      return { success: false, enriched: { error: "OMMIROUTE_URL not set" }, confidence: null, provider: "omniroute", model: MODEL, cost: 0 };
    }
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(request)),
    });
    if (!res.ok) {
      return { success: false, enriched: {}, confidence: null, provider: "omniroute", model: MODEL, cost: 0 };
    }
    const data = await res.json();
    const { enriched, confidence } = parseResponse(data);
    return {
      success: true,
      enriched,
      confidence,
      provider: "omniroute",
      model: MODEL,
      cost: 0,
    };
  },
};
