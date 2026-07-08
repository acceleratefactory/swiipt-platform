-- ============================================================
-- Phase 1.6 — Deactivate dead sources
-- Sets is_active = FALSE for sources that cannot work:
-- - scraper type (no implementation)
-- - api type with dead URLs
-- Idempotent: safe to re-run
-- ============================================================

-- Deactivate scraper type sources (no scraper implementation exists)
UPDATE opportunity_sources
SET is_active = FALSE
WHERE source_type = 'scraper'
  AND is_active = TRUE;

-- Deactivate API sources with known dead URLs
UPDATE opportunity_sources
SET is_active = FALSE
WHERE source_url IN (
  'https://andela.com/jobs-feed.json',
  'https://contra.com/api/jobs'
)
AND is_active = TRUE;

-- Verify: Run this to confirm dead sources are deactivated
-- SELECT name, source_type, source_url, is_active FROM opportunity_sources ORDER BY is_active DESC, name;
