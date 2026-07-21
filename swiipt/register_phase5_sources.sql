-- ============================================================
-- Phase 5 — Manual→Scraper Conversions + RSS Reactivation + Watchers
-- 5A: Manual→Scraper (5 dedicated + 3 generic)
-- 5B: RSS→Scraper (Erasmus Mundus mapped to existing scraper, others generic)
-- 5C: Watcher Activation (3 watchers)
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- ============================================================
-- 5C — Watcher Activation (3 sources, no code needed)
-- ============================================================
UPDATE opportunity_sources
SET source_status = 'active'
WHERE source_type = 'watcher'
AND source_status = 'pending_scraper'
AND name IN ('US Visa Bulletin', 'UK Visa Updates', 'Canada Immigration Updates');

-- ============================================================
-- 5B — RSS→Scraper Conversion
-- ============================================================

-- 1) Erasmus Mundus — map to existing erasmusPlusScraper
UPDATE opportunity_sources
SET source_type = 'scraper', source_status = 'active', is_active = true
WHERE name = 'Erasmus Mundus';

-- 2) XPRIZE Competitions — generic html-extractor
UPDATE opportunity_sources
SET source_type = 'scraper', source_status = 'active', is_active = true,
    source_url = 'https://www.xprize.org/competitions'
WHERE name = 'XPRIZE Competitions';

-- 3) Nomad List Jobs — generic html-extractor
UPDATE opportunity_sources
SET source_type = 'scraper', source_status = 'active', is_active = true
WHERE name = 'Nomad List Jobs';

-- 4) 500 Startups — generic html-extractor
UPDATE opportunity_sources
SET source_type = 'scraper', source_status = 'active', is_active = true,
    source_url = 'https://500.co'
WHERE name = '500 Startups';

-- 5) Lanyrd Conferences — acquired by Eventbrite, service shut down
-- (pending_scraper + is_active=false = effectively deactivated)
UPDATE opportunity_sources
SET source_status = 'pending_scraper', is_active = false
WHERE name = 'Lanyrd Conferences';

-- ============================================================
-- 5A — Manual→Scraper Conversions
-- ============================================================

-- Dedicated scraper sources (5 new scraper files)
UPDATE opportunity_sources
SET source_type = 'scraper', source_status = 'active', is_active = true
WHERE name IN (
  'GITEX Global',
  'Canton Fair Registration',
  'IMG Academy Soccer',
  'Aspire Academy Qatar',
  'Right to Dream Africa'
);

-- Generic html-extractor sources (change type to scraper, no dedicated file needed)
UPDATE opportunity_sources
SET source_type = 'scraper', source_status = 'active', is_active = true
WHERE name IN (
  'Ventures Platform',
  'VisaGuide World',
  'Y Combinator Startup School'
);

-- ============================================================
-- Deactivate permanently: missing URLs / login-gated
-- ============================================================
UPDATE opportunity_sources
SET source_status = 'pending_scraper', is_active = false
WHERE name IN (
  'Toptal Application',
  'DXB Express Visa',
  'NurseConnect UAE',
  'Health Recruitment International',
  'World Football Academy Trials',
  'Scout7 Africa'
);

-- ============================================================
-- Clean up Lanyrd replacement: remove dead RSS entry
-- (Lanyrd was acquired by Eventbrite; service shut down)
-- Note: Lanyrd already deactivated above. No alternative registered
-- since EventsEye Trade Shows already covers trade shows/conferences.
-- ============================================================

-- ============================================================
-- Verify Phase 5 sources
-- ============================================================
-- SELECT name, source_type, source_status, is_active
-- FROM opportunity_sources
-- WHERE name IN (
--   'US Visa Bulletin', 'UK Visa Updates', 'Canada Immigration Updates',
--   'Erasmus Mundus', 'XPRIZE Competitions', 'Nomad List Jobs', '500 Startups', 'Lanyrd Conferences',
--   'GITEX Global', 'Canton Fair Registration', 'IMG Academy Soccer',
--   'Aspire Academy Qatar', 'Right to Dream Africa',
--   'Ventures Platform', 'VisaGuide World', 'Y Combinator Startup School',
--   'Toptal Application', 'DXB Express Visa', 'NurseConnect UAE',
--   'Health Recruitment International', 'World Football Academy Trials', 'Scout7 Africa'
-- )
-- ORDER BY name;
