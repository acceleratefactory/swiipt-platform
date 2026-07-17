-- ============================================================
-- P0#3 — Quality gate columns (2026-07-17)
-- Adds quality/scam signals to opportunities + evidence so the pipeline
-- can reject low-value / spammy / scammy items instead of publishing them
-- on trivial mechanical checks (see audit §1.4 / §1.5).
--
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS ai_quality_score NUMERIC,
  ADD COLUMN IF NOT EXISTS is_scam_risk BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS quality_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_opportunities_quality
  ON opportunities (is_active, is_scam_risk);

ALTER TABLE evidence
  ADD COLUMN IF NOT EXISTS quality_score NUMERIC,
  ADD COLUMN IF NOT EXISTS is_scam_risk BOOLEAN DEFAULT FALSE;
