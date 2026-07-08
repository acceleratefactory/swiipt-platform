-- ============================================================
-- Phase 4 — Add 'watcher' to opportunity_sources source_type check constraint
-- ============================================================

ALTER TABLE opportunity_sources DROP CONSTRAINT IF EXISTS opportunity_sources_source_type_check;

ALTER TABLE opportunity_sources
  ADD CONSTRAINT opportunity_sources_source_type_check
  CHECK (source_type IN ('rss', 'api', 'scraper', 'manual', 'watcher'));

-- Verify: Run this to confirm
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'opportunity_sources_source_type_check';
