-- ============================================================
-- Phase 10 — Concurrent Processing + Rate Limiting
-- Adds concurrency and rate limit columns to opportunity_sources
-- ============================================================

ALTER TABLE opportunity_sources ADD COLUMN IF NOT EXISTS max_concurrent INTEGER DEFAULT 1;
ALTER TABLE opportunity_sources ADD COLUMN IF NOT EXISTS rate_limit_per_hour INTEGER DEFAULT 100;
ALTER TABLE opportunity_sources ADD COLUMN IF NOT EXISTS rate_used_this_hour INTEGER DEFAULT 0;
ALTER TABLE opportunity_sources ADD COLUMN IF NOT EXISTS rate_window_start TIMESTAMPTZ;

-- Set sensible defaults per source type
UPDATE opportunity_sources SET rate_limit_per_hour = 60 WHERE source_type = 'rss' AND rate_limit_per_hour = 100;
UPDATE opportunity_sources SET rate_limit_per_hour = 250 WHERE name = 'Himalayas';
UPDATE opportunity_sources SET rate_limit_per_hour = 60 WHERE name = 'Arbeitnow';
UPDATE opportunity_sources SET rate_limit_per_hour = 250 WHERE name = 'Adzuna';
UPDATE opportunity_sources SET rate_limit_per_hour = 1000 WHERE name = 'USAJOBS';
UPDATE opportunity_sources SET rate_limit_per_hour = 1000 WHERE name = 'Jooble';
UPDATE opportunity_sources SET rate_limit_per_hour = 100 WHERE name = 'Findwork';
UPDATE opportunity_sources SET max_concurrent = 3 WHERE source_type = 'rss';
UPDATE opportunity_sources SET max_concurrent = 1 WHERE source_type = 'api';

-- Verify
-- SELECT name, source_type, max_concurrent, rate_limit_per_hour FROM opportunity_sources ORDER BY name;
