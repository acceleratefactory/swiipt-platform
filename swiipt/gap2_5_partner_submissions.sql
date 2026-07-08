-- ============================================================
-- Gap 2-5 — Partner Submissions System
-- Adds API key to platform_partners + creates partner_submissions table
-- ============================================================

-- Step 1: Add API key columns to platform_partners
ALTER TABLE platform_partners ADD COLUMN IF NOT EXISTS api_key TEXT;
ALTER TABLE platform_partners ADD COLUMN IF NOT EXISTS api_key_hash TEXT;
ALTER TABLE platform_partners ADD COLUMN IF NOT EXISTS daily_submission_limit INTEGER DEFAULT 100;
ALTER TABLE platform_partners ADD COLUMN IF NOT EXISTS submissions_today INTEGER DEFAULT 0;
ALTER TABLE platform_partners ADD COLUMN IF NOT EXISTS submission_reset_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_partners_api_key_hash ON platform_partners (api_key_hash);

-- Step 2: Create partner_submissions table
CREATE TABLE IF NOT EXISTS partner_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES platform_partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organisation TEXT,
  description TEXT,
  url TEXT,
  location TEXT,
  type TEXT,
  deadline TEXT,
  salary TEXT,
  raw_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_submissions_partner_id ON partner_submissions (partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_submissions_status ON partner_submissions (status);

-- RLS: partners can read their own submissions, service role full access
ALTER TABLE partner_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on partner_submissions"
  ON partner_submissions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Verify
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'platform_partners' AND column_name LIKE 'api%';
-- SELECT tablename FROM pg_tables WHERE tablename = 'partner_submissions';
