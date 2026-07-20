-- ============================================================
-- Register Phase 2 scraper sources (Session 54)
-- HN Who Is Hiring, AngelList Talent, Indeed Global Remote, Glassdoor Remote Jobs
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- These sources were pre-registered as pending_scraper in an earlier P0 pass.
-- We flip them to active + scraper type so the ingest route dispatches to the
-- dedicated scrapers wired in src/lib/scraper-adapters.ts.

-- 1) HN Who Is Hiring (works via Algolia API)
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'HN Who Is Hiring', 'scraper', 'https://news.ycombinator.com/', 'tech_professional', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'HN Who Is Hiring');

-- 2) AngelList Talent (now Wellfound) — public page; API deferred pending key
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'AngelList Talent', 'scraper', 'https://wellfound.com/jobs', 'tech_professional', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'AngelList Talent');

-- 3) Indeed Global Remote — stealth scraper; substitute for WWR RSS gap if blocked
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Indeed Global Remote', 'scraper', 'https://www.indeed.com/q-remote-jobs.html', 'job_seeker', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Indeed Global Remote');

-- 4) Glassdoor Remote Jobs — stealth scraper; gracefully yields 0 if blocked
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Glassdoor Remote Jobs', 'scraper', 'https://www.glassdoor.com/Job/remote-jobs-SRCH_KO0,6.htm', 'job_seeker', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Glassdoor Remote Jobs');

-- Activate existing rows (if already registered but not active)
UPDATE opportunity_sources
SET source_status = 'active', is_active = true, source_type = 'scraper'
WHERE name IN ('HN Who Is Hiring', 'AngelList Talent', 'Indeed Global Remote', 'Glassdoor Remote Jobs')
AND (source_status IS DISTINCT FROM 'active' OR is_active IS DISTINCT FROM true OR source_type IS DISTINCT FROM 'scraper');

-- Verify
-- SELECT name, source_type, source_status, is_active, segment_slug, trust_tier
-- FROM opportunity_sources
-- WHERE name IN ('HN Who Is Hiring', 'AngelList Talent', 'Indeed Global Remote', 'Glassdoor Remote Jobs')
-- ORDER BY name;
