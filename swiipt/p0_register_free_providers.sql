-- Register a 4-deep FREE provider chain in ai_providers.
-- OpenCode Zen (deepseek-v4-flash-free primary) + 2 more OpenCode free models
-- as fallbacks, + OpenRouter (gpt-oss-20b:free) + Gemini as last resort.
-- Idempotent: skips rows that already exist (matched by provider_slug+model+name).
-- API keys come from Vercel env vars (OPENCODE_API_KEY, OPENROUTER_API_KEY,
-- GEMINI_API_KEY) via ai-service.ts API_KEY_ENV_MAP; api_key column left empty.

-- OpenCode Zen free models (base_url is the Zen OpenAI-compatible endpoint).
-- deepseek-v4-flash-free: cleanest JSON, best org extraction -> PRIMARY.
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'OpenCode Zen (deepseek-v4-flash-free)', 'opencode', 'https://opencode.ai/zen/v1', '', 'deepseek-v4-flash-free', true, 10
WHERE NOT EXISTS (
  SELECT 1 FROM ai_providers WHERE provider_slug='opencode' AND model='deepseek-v4-flash-free'
);

-- mimo-v2.5-free: solid JSON -> fallback 2.
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'OpenCode Zen (mimo-v2.5-free)', 'opencode', 'https://opencode.ai/zen/v1', '', 'mimo-v2.5-free', true, 20
WHERE NOT EXISTS (
  SELECT 1 FROM ai_providers WHERE provider_slug='opencode' AND model='mimo-v2.5-free'
);

-- north-mini-code-free: best org extraction -> fallback 3.
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'OpenCode Zen (north-mini-code-free)', 'opencode', 'https://opencode.ai/zen/v1', '', 'north-mini-code-free', true, 30
WHERE NOT EXISTS (
  SELECT 1 FROM ai_providers WHERE provider_slug='opencode' AND model='north-mini-code-free'
);

-- OpenRouter free model -> fallback 4 (currently rate-limited, recovers on reset).
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'OpenRouter (gpt-oss-20b:free)', 'openrouter', 'https://openrouter.ai/api/v1', '', 'openai/gpt-oss-20b:free', true, 40
WHERE NOT EXISTS (
  SELECT 1 FROM ai_providers WHERE provider_slug='openrouter' AND model='openai/gpt-oss-20b:free'
);

-- Gemini free model -> last resort.
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'Gemini (gemini-2.0-flash-001)', 'gemini', 'https://generativelanguage.googleapis.com/v1beta', '', 'gemini-2.0-flash-001', true, 50
WHERE NOT EXISTS (
  SELECT 1 FROM ai_providers WHERE provider_slug='gemini' AND model='gemini-2.0-flash-001'
);

-- Show resulting chain ordered by priority.
SELECT priority, provider_slug, model, is_active FROM ai_providers ORDER BY priority;
