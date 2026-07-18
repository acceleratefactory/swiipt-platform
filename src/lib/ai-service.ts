import { createServiceClient } from "@/lib/supabase/service";
import type { AIEnrichRequest, AIEnrichResponse, AIProviderAdapter } from "./ai/providers/index";
import { omnirouteProvider } from "./ai/providers/omniroute";
import { geminiProvider } from "./ai/providers/gemini";
import { deepseekProvider } from "./ai/providers/deepseek";
import { qwenProvider } from "./ai/providers/qwen";
import { opencodeProvider } from "./ai/providers/opencode";
import { openrouterProvider } from "./ai/providers/openrouter";

const ADAPTERS: Record<string, AIProviderAdapter> = {
  omniroute: omnirouteProvider,
  gemini: geminiProvider,
  deepseek: deepseekProvider,
  qwen: qwenProvider,
  opencode: opencodeProvider,
  openrouter: openrouterProvider,
};

const API_KEY_ENV_MAP: Record<string, string> = {
  omniroute: "OMNIROUTE_API_KEY",
  gemini: "GEMINI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  qwen: "QWEN_API_KEY",
  opencode: "OPENCODE_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

interface ActiveProvider {
  slug: string;
  apiKey: string;
  adapter: AIProviderAdapter;
  priority: number;
  model?: string;
}

/**
 * Fetch active providers from ai_providers table, ordered by priority.
 * Returns providers whose adapter is registered and API key is set.
 */
async function getActiveProviders(): Promise<ActiveProvider[]> {
  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  if (!rows) return [];

  const providers: ActiveProvider[] = [];
  for (const row of rows) {
    const adapter = ADAPTERS[row.provider_slug];
    if (!adapter) continue;
    const apiKey = process.env[API_KEY_ENV_MAP[row.provider_slug]] || row.api_key;
    if (!apiKey) continue;
    providers.push({ slug: row.provider_slug, apiKey, adapter, priority: row.priority, model: row.model || undefined });
  }
  return providers;
}

/**
 * Enrich opportunity data using the best available AI provider.
 * Tries providers in priority order and ALWAYS walks the full chain — a
 * failed provider (bad key, 400, empty response, throw) is skipped and the
 * next one is tried, regardless of position. This makes the chain
 * order-independent: the working provider is reached even if it sits after a
 * broken one.
 *
 * Retry with exponential backoff ONLY when every attempted provider failed
 * PURELY due to rate-limiting (HTTP 429) — free tiers reset their limits
 * after a short wait, so this lets the backfill drain without manual
 * re-runs. Structural failures (non-429) are NOT retried. Never throws.
 */
const RATE_LIMIT_MAX_RETRIES = 4;
const RATE_LIMIT_BACKOFF_MS = 8000; // 8s, then 16s, 32s, 64s

export async function enrich(request: AIEnrichRequest): Promise<AIEnrichResponse> {
  const providers = await getActiveProviders();
  if (providers.length === 0) {
    return { success: false, enriched: {}, confidence: null, provider: "none", model: "", cost: 0 };
  }

  const errors: string[] = [];
  for (let attempt = 0; attempt <= RATE_LIMIT_MAX_RETRIES; attempt++) {
    let anyRateLimited = false;
    let anyNonRateLimitedFailure = false;
    for (const p of providers) {
      try {
        const result = await p.adapter.enrich(request, p.apiKey, p.model);
        if (result.success) return result; // first working provider wins
        // Failed, but still tried: skip it and continue to the next provider.
        if (result.rateLimited) anyRateLimited = true;
        else anyNonRateLimitedFailure = true;
        errors.push(`${p.slug}: provider returned failure`);
      } catch (err: any) {
        anyNonRateLimitedFailure = true;
        errors.push(`${p.slug}: ${err?.message || "unknown error"}`);
      }
    }
    // Retry only if the chain failed ENTIRELY due to rate-limiting. If any
    // provider had a structural (non-429) failure there is no point
    // retrying, so stop. A purely-rate-limited chain may recover on retry.
    if (!anyRateLimited || anyNonRateLimitedFailure) break;
    if (attempt < RATE_LIMIT_MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_BACKOFF_MS * Math.pow(2, attempt)));
    }
  }
  return { success: false, enriched: { errors }, confidence: null, provider: "none", model: "", cost: 0 };
}

/**
 * Check whether any AI provider is available (has active row + API key).
 */
export async function isAIAvailable(): Promise<boolean> {
  const providers = await getActiveProviders();
  return providers.length > 0;
}
