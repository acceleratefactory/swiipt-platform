-- ============================================================
-- Phase 3 — Seed API sources into opportunity_sources
-- Himalayas (no auth), Arbeitnow (no auth), Adzuna (API key),
-- Jooble (API key), USAJOBS (API key), Findwork (API key)
-- ============================================================

-- No-auth sources (active immediately)
INSERT INTO opportunity_sources (name, source_type, source_url, trust_tier, is_active, pull_frequency_hours)
SELECT 'Himalayas', 'api', 'https://himalayas.app/jobs/api', 'standard', true, 6
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Himalayas');

INSERT INTO opportunity_sources (name, source_type, source_url, trust_tier, is_active, pull_frequency_hours)
SELECT 'Arbeitnow', 'api', 'https://www.arbeitnow.com/api/job-board-api', 'standard', true, 6
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Arbeitnow');

-- API-key sources (activate after setting env vars)
INSERT INTO opportunity_sources (name, source_type, source_url, trust_tier, is_active, pull_frequency_hours)
SELECT 'Adzuna', 'api', 'https://api.adzuna.com/v1/api/jobs/gb/search/1', 'standard', false, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Adzuna');

INSERT INTO opportunity_sources (name, source_type, source_url, trust_tier, is_active, pull_frequency_hours)
SELECT 'Jooble', 'api', 'https://jooble.org/api/', 'standard', false, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Jooble');

INSERT INTO opportunity_sources (name, source_type, source_url, trust_tier, is_active, pull_frequency_hours)
SELECT 'USAJOBS', 'api', 'https://data.usajobs.gov/api/search', 'standard', false, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'USAJOBS');

INSERT INTO opportunity_sources (name, source_type, source_url, trust_tier, is_active, pull_frequency_hours)
SELECT 'Findwork', 'api', 'https://findwork.dev/api/jobs/', 'standard', false, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Findwork');

-- Verify: Run this to confirm
-- SELECT name, source_type, is_active, pull_frequency_hours FROM opportunity_sources WHERE source_type = 'api';
