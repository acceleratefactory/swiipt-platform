-- ============================================================
-- Health Monitoring — Add error tracking columns + health log
-- ============================================================

-- Step 1: Add error tracking columns to opportunity_sources
ALTER TABLE opportunity_sources ADD COLUMN IF NOT EXISTS consecutive_errors INTEGER DEFAULT 0;
ALTER TABLE opportunity_sources ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE opportunity_sources ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ;

-- Step 2: Create source_health_log for per-pull logging
CREATE TABLE IF NOT EXISTS source_health_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES opportunity_sources(id) ON DELETE CASCADE,
  pulled_at TIMESTAMPTZ DEFAULT now(),
  items_found INTEGER DEFAULT 0,
  items_new INTEGER DEFAULT 0,
  items_duplicate INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  success BOOLEAN DEFAULT true
);

-- Index for fast lookups by source
CREATE INDEX IF NOT EXISTS idx_source_health_log_source_id ON source_health_log (source_id, pulled_at DESC);

-- RLS: service client only
ALTER TABLE source_health_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on source_health_log"
  ON source_health_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Verify
-- SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'source_health_log';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'opportunity_sources' AND column_name IN ('consecutive_errors','last_error','last_error_at');
