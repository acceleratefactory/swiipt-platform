-- ============================================================
-- Sprint 19 Phase 2: Seed ai_providers with free models
-- Idempotent: safe to re-run, uses ON CONFLICT DO NOTHING
-- ============================================================

-- Gemini 1.5 Flash (free tier: 60 requests/minute)
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
VALUES (
  'Gemini 1.5 Flash',
  'gemini',
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
  '',  -- uses GEMINI_API_KEY env var
  'gemini-1.5-flash',
  TRUE,
  1
) ON CONFLICT (provider_slug) DO NOTHING;

-- DeepSeek Chat (fallback, free tier available)
INSERT INTO ai_providers (name, provider_slug, base_url, api_key, model, is_active, priority)
VALUES (
  'DeepSeek Chat',
  'deepseek',
  'https://api.deepseek.com/v1/chat/completions',
  '',  -- uses DEEPSEEK_API_KEY env var
  'deepseek-chat',
  TRUE,
  2
) ON CONFLICT (provider_slug) DO NOTHING;
