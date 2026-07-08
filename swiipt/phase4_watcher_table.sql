-- ============================================================
-- Phase 4 — Watcher system: page_hashes table
-- Stores last-known content hashes for page change detection
-- ============================================================

CREATE TABLE IF NOT EXISTS page_hashes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES opportunity_sources(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  content_snapshot TEXT,
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  last_changed_at TIMESTAMPTZ,
  change_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- One hash record per source URL
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_hashes_source_url ON page_hashes (source_id, page_url);

-- Fast lookup by source
CREATE INDEX IF NOT EXISTS idx_page_hashes_source_id ON page_hashes (source_id);

-- RLS: service client only (admin-managed, no user access)
ALTER TABLE page_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on page_hashes"
  ON page_hashes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Verify: Run this to confirm
-- SELECT schemaname, tablename FROM pg_tables WHERE tablename = 'page_hashes';
