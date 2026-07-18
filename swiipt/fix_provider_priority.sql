-- Make Gemini the first-priority provider (user confirmed its key works).
-- Omniroute/OpenCode returned empty/erroring responses, blocking the chain.
UPDATE ai_providers SET priority = 1 WHERE provider_slug = 'gemini';
UPDATE ai_providers SET priority = 2 WHERE provider_slug = 'omniroute';
UPDATE ai_providers SET priority = 3 WHERE provider_slug = 'openrouter';
UPDATE ai_providers SET priority = 4 WHERE provider_slug = 'opencode';
UPDATE ai_providers SET priority = 5 WHERE provider_slug = 'deepseek';
UPDATE ai_providers SET priority = 6 WHERE provider_slug = 'qwen';
SELECT provider_slug, priority, is_active FROM ai_providers ORDER BY priority;
