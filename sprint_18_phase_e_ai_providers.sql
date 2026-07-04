-- ============================================================
-- Sprint 18 Phase E — AI Providers table
-- idempotent: safe to re-run, drops nothing, only adds
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_slug TEXT NOT NULL UNIQUE,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_providers' AND column_name = 'is_active') THEN
    ALTER TABLE ai_providers ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_providers' AND column_name = 'priority') THEN
    ALTER TABLE ai_providers ADD COLUMN priority INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_providers_active_priority
  ON ai_providers (priority ASC)
  WHERE is_active = TRUE;
