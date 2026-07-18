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
 * Tries providers in priority order. Falls back to next on failure.
 * Never throws — returns { success: false } if no provider succeeds.
 */
export async function enrich(request: AIEnrichRequest): Promise<AIEnrichResponse> {
  const providers = await getActiveProviders();
  if (providers.length === 0) {
    return { success: false, enriched: {}, confidence: null, provider: "none", model: "", cost: 0 };
  }

  const errors: string[] = [];
  for (const p of providers) {
    try {
      const result = await p.adapter.enrich(request, p.apiKey, p.model);
      if (result.success) return result;
      errors.push(`${p.slug}: provider returned failure`);
    } catch (err: any) {
      errors.push(`${p.slug}: ${err?.message || "unknown error"}`);
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
