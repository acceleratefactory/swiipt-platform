-- ===========================================================
-- P0#1a — Register generic-scraper sources as ACTIVE.
-- FIX: the earlier p0_1a_register_scrapers.sql set source_status +
-- source_type but MISSED is_active=true. The ingest query requires
-- is_active=true, so every scraper source was silently skipped
-- (0 health rows, 0 web evidence). This corrects that.
-- Run in Supabase SQL Editor. Idempotent.
-- ===========================================================

-- 1) HTML scraper sources -> type='scraper', status='active', ACTIVE
UPDATE opportunity_sources
SET is_active = true,
    source_type = 'scraper',
    source_status = 'active'
WHERE name IN (
  'DAAD Scholarships',
  'Chevening Scholarships',
  'Commonwealth Scholarships',
  'NHS Jobs International',
  'Make It In Germany',
  'Canada IRCC Express Entry',
  'UAE Golden Visa News',
  'LinkedIn Nigeria Remote',
  'TransferMarket Africa Trials'
);

-- 2) RSS sources -> already type='rss', just ACTIVATE
UPDATE opportunity_sources
SET is_active = true, source_status = 'active'
WHERE name IN (
  'Health Careers UK',
  'Jobberman International',
  'We Work Remotely',
  'Scholars4Dev Africa',
  'Opportunity Desk Scholarships'
);

-- 3) JSON-API sources -> already type='api', just ACTIVATE
UPDATE opportunity_sources
SET is_active = true, source_status = 'active'
WHERE name IN (
  'Andela Network Jobs',
  'Remote OK Africa',
  'Contra Remote Jobs'
);

-- 4) Manual / curated-only sources stay is_active=false (no scraper
--    URL; admin curates via paste-URL). Left unchanged on purpose:
--    (NurseConnect UAE, Right to Dream Africa, Canton Fair Registration,
--     GITEX Global, UK Visas & Immigration, Indeed Global Remote,
--     Glassdoor Remote Jobs, AngelList Talent, HN Who Is Hiring,
--     MastersPortal, British Council Scholarships, Fulbright Program,
--     Gates Cambridge, Nursing Jobs Australia, Allied Health Careers,
--     Seedstars World, African Business Heroes, Global Football Trials UK,
--     PeoplePerHour, Trade Jobs Abroad, Skilled Trades Canada,
--     Trades UK Visa Jobs, Australia Home Affairs)

-- 5) Verify (all should now be is_active=true)
-- SELECT name, source_type, source_status, is_active
-- FROM opportunity_sources
-- WHERE source_type = 'scraper' OR name IN
--   ('Health Careers UK','Jobberman International','We Work Remotely',
--    'Scholars4Dev Africa','Opportunity Desk Scholarships',
--    'Andela Network Jobs','Remote OK Africa','Contra Remote Jobs')
-- ORDER BY source_type, name;
