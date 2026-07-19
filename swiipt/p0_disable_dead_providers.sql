-- ============================================================
-- Disable gemini + openrouter (both 429 / quota 0 — dead free tiers).
-- opencode is the only working provider (verified 2026-07-18:
-- translate backfill translated=3 failed=0 after max_tokens fix).
-- Keeps opencode primary; deepseek/qwen stay inactive (no Vercel key).
-- Run in Supabase SQL Editor. Safe / idempotent.
-- ============================================================

UPDATE ai_providers SET is_active = false WHERE provider_slug = 'gemini';
UPDATE ai_providers SET is_active = false WHERE provider_slug = 'openrouter';

-- Verify: opencode should be the only is_active=true provider.
SELECT provider_slug, model, priority, is_active
FROM ai_providers
ORDER BY priority;
