-- ============================================================
-- Register Phase 3 scraper sources (Session 54)
-- PeoplePerHour, African Business Heroes, Seedstars World,
-- Allied Health Careers, Nursing Jobs Australia, Global Football Trials UK
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- These sources are registered as pending_scraper. We activate them
-- and set source_type='scraper' so the ingest route dispatches to
-- the dedicated scrapers in src/lib/scraper-adapters.ts.

-- 1) PeoplePerHour — freelance gig listings from peopleperhour.com
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'PeoplePerHour', 'scraper', 'https://www.peopleperhour.com', 'freelancer', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'PeoplePerHour');

-- 2) African Business Heroes — entrepreneurship competition
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'African Business Heroes', 'scraper', 'https://africanbusinessheroes.org/apply', 'entrepreneur', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'African Business Heroes');

-- 3) Seedstars World — entrepreneurship competitions/events
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Seedstars World', 'scraper', 'https://seedstars.com/events', 'entrepreneur', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Seedstars World');

-- 4) Allied Health Careers — healthcare staffing/jobs
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Allied Health Careers', 'scraper', 'https://www.alliedhealthcareers.com', 'healthcare', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Allied Health Careers');

-- 5) Nursing Jobs Australia — nursing job board
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Nursing Jobs Australia', 'scraper', 'https://www.nursingjobs.com.au', 'healthcare', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Nursing Jobs Australia');

-- 6) Global Football Trials UK — football trial events
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Global Football Trials UK', 'scraper', 'https://www.globalfootballtrials.com', 'footballer', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Global Football Trials UK');

-- Activate existing rows (if already registered but not active)
UPDATE opportunity_sources
SET source_status = 'active', is_active = true, source_type = 'scraper'
WHERE name IN ('PeoplePerHour', 'African Business Heroes', 'Seedstars World',
               'Allied Health Careers', 'Nursing Jobs Australia', 'Global Football Trials UK')
AND (source_status IS DISTINCT FROM 'active' OR is_active IS DISTINCT FROM true OR source_type IS DISTINCT FROM 'scraper');

-- Verify
-- SELECT name, source_type, source_status, is_active, segment_slug, trust_tier
-- FROM opportunity_sources
-- WHERE name IN ('PeoplePerHour', 'African Business Heroes', 'Seedstars World',
--                'Allied Health Careers', 'Nursing Jobs Australia', 'Global Football Trials UK')
-- ORDER BY name;
