-- Register aiand (Qwen3.6-27B free) as a fallback AI provider.
-- Priority 25 sits between opencode (10) and openrouter (30).
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
SELECT 'AIAND (Qwen3.6-27B free)', 'aiand', 'https://api.aiand.com/v1', '', 'Qwen3.6-27B', true, 25
WHERE NOT EXISTS (SELECT 1 FROM ai_providers WHERE provider_slug='aiand');

SELECT priority, provider_slug, model, is_active FROM ai_providers ORDER BY priority;
