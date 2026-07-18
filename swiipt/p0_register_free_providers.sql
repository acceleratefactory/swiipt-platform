-- Fix the ai_providers chain. The table has a UNIQUE constraint on
-- provider_slug, so each provider has exactly ONE row. The multi-model
-- redundancy lives INSIDE the adapters (opencode.ts / openrouter.ts try
-- several free models in order, falling through on 429/empty).
--
-- Existing rows had STALE models (gemini-1.5-flash 404s; gpt-4o-mini is
-- not a valid OpenRouter slug). This script UPDATES the 3 known rows to
-- good free models + priorities, and only INSERTS if a slug is missing.
--
-- Final chain (by priority):
--   10 opencode   deepseek-v4-flash-free  (PRIMARY, free, not throttled)
--   20 gemini     gemini-2.0-flash-001  (free)
--   30 openrouter openai/gpt-oss-20b:free (free; recovers after 429)
--   40 deepseek / 50 qwen / 60 omniroute (existing, low priority)

-- OpenCode Zen: PRIMARY free provider.
UPDATE ai_providers
SET name = 'OpenCode Zen (free)', base_url = 'https://opencode.ai/zen/v1',
    api_key = '', model = 'deepseek-v4-flash-free', is_active = true, priority = 10
WHERE provider_slug = 'opencode';

INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'OpenCode Zen (free)', 'opencode', 'https://opencode.ai/zen/v1', '', 'deepseek-v4-flash-free', true, 10
WHERE NOT EXISTS (SELECT 1 FROM ai_providers WHERE provider_slug='opencode');

-- Gemini: use the valid free flash model (gemini-1.5-flash is removed/404).
UPDATE ai_providers
SET name = 'Gemini (gemini-2.0-flash-001)', base_url = 'https://generativelanguage.googleapis.com/v1beta',
    api_key = '', model = 'gemini-2.0-flash-001', is_active = true, priority = 20
WHERE provider_slug = 'gemini';

INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'Gemini (gemini-2.0-flash-001)', 'gemini', 'https://generativelanguage.googleapis.com/v1beta', '', 'gemini-2.0-flash-001', true, 20
WHERE NOT EXISTS (SELECT 1 FROM ai_providers WHERE provider_slug='gemini');

-- OpenRouter: valid free slug must include ":free".
UPDATE ai_providers
SET name = 'OpenRouter (free)', base_url = 'https://openrouter.ai/api/v1',
    api_key = '', model = 'openai/gpt-oss-20b:free', is_active = true, priority = 30
WHERE provider_slug = 'openrouter';

INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'OpenRouter (free)', 'openrouter', 'https://openrouter.ai/api/v1', '', 'openai/gpt-oss-20b:free', true, 30
WHERE NOT EXISTS (SELECT 1 FROM ai_providers WHERE provider_slug='openrouter');

-- Push the old/never-working providers to the bottom so they don't block.
UPDATE ai_providers SET priority = 40 WHERE provider_slug = 'deepseek';
UPDATE ai_providers SET priority = 50 WHERE provider_slug = 'qwen';
UPDATE ai_providers SET priority = 60 WHERE provider_slug = 'omniroute';

-- Resulting chain ordered by priority.
SELECT priority, provider_slug, model, is_active FROM ai_providers ORDER BY priority;
