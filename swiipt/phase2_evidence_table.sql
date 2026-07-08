-- ============================================================
-- Phase 2: Evidence-First Architecture
-- Creates evidence table + adds provenance column to opportunities
-- Idempotent: uses IF NOT EXISTS
-- Does NOT drop any tables, columns, functions, or constraints
-- ============================================================

-- 1. Create evidence table
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'rss', 'api', 'web', 'email', 'partner', 'pdf',
    'government', 'social_facebook', 'social_linkedin',
    'messaging', 'manual', 'url', 'watcher'
  )),
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_url TEXT,
  source_name TEXT,
  content_hash TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'processing', 'enriched', 'failed')),
  opportunity_id UUID,
  enriched_data JSONB,
  ai_model TEXT,
  ai_confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add provenance column to opportunities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'opportunities' AND column_name = 'provenance'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN provenance JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 3. Indexes for evidence table
CREATE INDEX IF NOT EXISTS idx_evidence_enrichment_status ON evidence(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_evidence_captured_at ON evidence(captured_at);
CREATE INDEX IF NOT EXISTS idx_evidence_source_name ON evidence(source_name);
CREATE INDEX IF NOT EXISTS idx_evidence_content_hash ON evidence(content_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_opportunity_id ON evidence(opportunity_id);

-- 4. RLS policies for evidence (admin only)
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'evidence' AND policyname = 'admin_all_evidence'
  ) THEN
    CREATE POLICY admin_all_evidence ON evidence
      FOR ALL
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
      );
  END IF;
END $$;

-- 5. Grants
GRANT ALL ON evidence TO service_role;
GRANT SELECT ON evidence TO authenticated;

-- Verify: Run these to confirm
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'evidence' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'opportunities' AND column_name = 'provenance';
