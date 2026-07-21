-- ============================================================
-- Register Phase 4 scraper sources (Session 54)
-- Canada Job Bank, Jooble, Careerjet UK, Australia Home Affairs,
-- UK Visas & Immigration
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- 1) Canada Job Bank — Canadian government job bank (trades focus)
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Canada Job Bank', 'scraper', 'https://jobbank.gc.ca/jobsearch/jobsearch?searchstring=trades&sort=D', 'trade_worker', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Canada Job Bank');

-- 2) Jooble — overseas construction & trades jobs (replaces dead tradejobsabroad.com)
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Jooble', 'scraper', 'https://jooble.org/jobs-overseas-construction', 'trade_worker', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Jooble');

-- 3) Careerjet UK — UK visa sponsorship construction jobs (replaces dead tradesukvisa.com)
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Careerjet UK', 'scraper', 'https://www.careerjet.co.uk/visa-sponsorship-construction-jobs', 'trade_worker', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Careerjet UK');

-- 4) Australia Home Affairs — official immigration news (was 404 on /news, now /news-media)
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Australia Home Affairs', 'scraper', 'https://www.homeaffairs.gov.au/news-media', 'job_seeker', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Australia Home Affairs');

-- 5) UK Visas & Immigration — official UK visa & immigration news
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'UK Visas & Immigration', 'scraper', 'https://www.gov.uk/government/organisations/uk-visas-and-immigration', 'job_seeker', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'UK Visas & Immigration');

-- Activate existing rows (handles case where sources already registered)
UPDATE opportunity_sources
SET source_status = 'active', is_active = true, source_type = 'scraper'
WHERE name IN ('Canada Job Bank', 'Jooble', 'Careerjet UK', 'Australia Home Affairs', 'UK Visas & Immigration')
AND (source_status IS DISTINCT FROM 'active' OR is_active IS DISTINCT FROM true OR source_type IS DISTINCT FROM 'scraper');

-- Verify
-- SELECT name, source_type, source_status, is_active, segment_slug, trust_tier
-- FROM opportunity_sources
-- WHERE name IN ('Canada Job Bank', 'Jooble', 'Careerjet UK', 'Australia Home Affairs', 'UK Visas & Immigration')
-- ORDER BY name;
