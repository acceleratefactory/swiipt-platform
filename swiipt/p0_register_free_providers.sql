-- Register a FREE provider chain in ai_providers.
-- NOTE: ai_providers enforces a UNIQUE constraint on provider_slug, so each
-- provider can have only ONE row. The multi-model redundancy lives INSIDE the
-- adapters (opencode.ts / openrouter.ts now try several free models in order,
-- falling through on 429/empty). So we register one row per provider here, and
-- set priorities so the best free provider is tried first.
--
-- Chain (by priority):
--   10 opencode   (Zen: deepseek-v4-flash-free primary + 3 more fallbacks)  <- PRIMARY
--   20 gemini     (gemini-2.0-flash-001)
--   30 openrouter (gpt-oss-20b:free primary + 3 more fallbacks)  <- recovers after 429
--   40 deepseek / 50 qwen / 60 omniroute  (existing rows, kept but low priority)
--
-- Idempotent: skips rows whose provider_slug already exists.
-- API keys come from Vercel env vars (OPENCODE_API_KEY, GEMINI_API_KEY,
-- OPENROUTER_API_KEY) via ai-service.ts API_KEY_ENV_MAP; api_key left empty.

-- OpenCode Zen (PRIMARY): free, not rate-limited like OpenRouter.
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'OpenCode Zen (free)', 'opencode', 'https://opencode.ai/zen/v1', '', 'deepseek-v4-flash-free', true, 10
WHERE NOT EXISTS (SELECT 1 FROM ai_providers WHERE provider_slug='opencode');

-- Gemini (free flash).
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'Gemini (gemini-2.0-flash-001)', 'gemini', 'https://generativelanguage.googleapis.com/v1beta', '', 'gemini-2.0-flash-001', true, 20
WHERE NOT EXISTS (SELECT 1 FROM ai_providers WHERE provider_slug='gemini');

-- OpenRouter (free; recovers after the current 429 window).
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'OpenRouter (free)', 'openrouter', 'https://openrouter.ai/api/v1', '', 'openai/gpt-oss-20b:free', true, 30
WHERE NOT EXISTS (SELECT 1 FROM ai_providers WHERE provider_slug='openrouter');

-- Push the old/never-working providers to the bottom so they don't block.
UPDATE ai_providers SET priority = 40 WHERE provider_slug = 'deepseek';
UPDATE ai_providers SET priority = 50 WHERE provider_slug = 'qwen';
UPDATE ai_providers SET priority = 60 WHERE provider_slug = 'omniroute';

-- Show resulting chain ordered by priority.
SELECT priority, provider_slug, model, is_active FROM ai_providers ORDER BY priority;
