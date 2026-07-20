-- ============================================================
-- Register 5 new dedicated scraper sources (2026-07-20)
-- For: grants.gov, International Scholarships, 10times Events,
--      Erasmus+ Programme, Coursera Free Courses
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- 1) Grants.gov → grant type
-- May already exist as pending_scraper; activate it
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Grants.gov', 'scraper', 'https://www.grants.gov/search-grants', 'job_seeker', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Grants.gov');

UPDATE opportunity_sources
SET source_type = 'scraper',
    source_url = 'https://www.grants.gov/search-grants',
    is_active = true,
    source_status = 'active',
    pull_frequency_hours = 24
WHERE name = 'Grants.gov' AND (is_active = false OR source_status != 'active');

-- 2) International Scholarships (alternative to Scholarships.com which is Cloudflare-protected)
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'International Scholarships', 'scraper', 'https://www.internationalscholarships.com/', 'student', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'International Scholarships');

-- Also add Scholarships.com as scraper (will fall through to generic if blocked)
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Scholarships.com', 'scraper', 'https://www.scholarships.com/', 'student', 'standard', 48, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Scholarships.com');

-- 3) 10times Events → trade_show type
-- May exist as RSS; add as separate scraper source for richer data
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT '10times Events', 'scraper', 'https://10times.com/events', 'job_seeker', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = '10times Events' AND source_type = 'scraper');

-- 4) Erasmus+ Programme → exchange type
-- May already exist as pending_scraper; activate it
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Erasmus+ Programme', 'scraper', 'https://erasmus-plus.ec.europa.eu/opportunities', 'student', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Erasmus+ Programme');

UPDATE opportunity_sources
SET source_type = 'scraper',
    source_url = 'https://erasmus-plus.ec.europa.eu/opportunities',
    is_active = true,
    source_status = 'active',
    pull_frequency_hours = 24
WHERE name = 'Erasmus+ Programme' AND (is_active = false OR source_status != 'active');

-- 5) Coursera Free Courses → training type
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Coursera Free Courses', 'scraper', 'https://www.coursera.org/courses?query=free', 'student', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Coursera Free Courses');

-- Done
-- Verify: SELECT name, source_type, source_status, is_active FROM opportunity_sources WHERE source_type = 'scraper' ORDER BY name;
