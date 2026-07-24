export interface AIEnrichRequest {
  task: "process-queue" | "ingest-parse" | "paste-url" | "public-submission" | "translate" | "content-clean";
  data: Record<string, any>;
  tier?: "trusted" | "standard" | "review_all";
}

export interface AIEnrichResponse {
  success: boolean;
  enriched: Record<string, any>;
  confidence: number | null;
  provider: string;
  model: string;
  cost: number;
  /** Set when the provider rejected with HTTP 429 (rate-limited). */
  rateLimited?: boolean;
  /** Diagnostic: underlying failure detail from the last attempted provider
   *  (HTTP body, exception message, or "empty response"). Undefined on success. */
  detail?: string;
}

export interface AIProviderAdapter {
  slug: string;
  name: string;
  enrich(request: AIEnrichRequest, apiKey: string, modelOverride?: string): Promise<AIEnrichResponse>;
  isAvailable(apiKey: string): boolean;
}
