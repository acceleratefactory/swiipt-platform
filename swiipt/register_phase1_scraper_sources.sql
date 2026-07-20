-- ============================================================
-- Register Phase 1 scraper sources (Session 54)
-- Scholars4Dev, British Council Scholarships, Fulbright Program, Gates Cambridge
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- 1) Scholars4Dev (replaces MastersPortal — 403 blocked)
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Scholars4Dev', 'scraper', 'https://www.scholars4dev.com/', 'student', 'trusted', 12, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Scholars4Dev');

-- 2) British Council Scholarships
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'British Council Scholarships', 'scraper', 'https://study-uk.britishcouncil.org/scholarships', 'student', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'British Council Scholarships');

-- 3) Fulbright Program
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Fulbright Program', 'scraper', 'https://us.fulbrightonline.org/about/fulbright-us-student-program', 'student', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Fulbright Program');

-- 4) Gates Cambridge
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Gates Cambridge', 'scraper', 'https://www.gatescambridge.org/apply', 'student', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Gates Cambridge');

-- Activate existing rows (if already registered but not active)
UPDATE opportunity_sources
SET source_status = 'active', is_active = true
WHERE name IN ('Scholars4Dev', 'British Council Scholarships', 'Fulbright Program', 'Gates Cambridge')
AND (source_status IS DISTINCT FROM 'active' OR is_active IS DISTINCT FROM true);

-- Verify
-- SELECT name, source_type, source_status, is_active, segment_slug, trust_tier
-- FROM opportunity_sources
-- WHERE name IN ('Scholars4Dev', 'British Council Scholarships', 'Fulbright Program', 'Gates Cambridge')
-- ORDER BY name;
