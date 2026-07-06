-- Source health monitoring columns for opportunity_sources
-- Enhancement #9 from sprint_19_amendment_3_15_enhancements_assessment.md
ALTER TABLE opportunity_sources
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_errors INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_degraded BOOLEAN DEFAULT FALSE;
