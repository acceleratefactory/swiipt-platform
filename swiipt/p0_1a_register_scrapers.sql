-- ===========================================================
-- P0#1a — Register the generic-scraper sources as ACTIVE.
-- The generic HTML extractor (src/lib/html-extractor.ts) + ingest
-- dispatch now handle source_type='scraper' (and rss/api already work).
-- This flips the 14 valuable sources from 'pending_scraper' to
-- 'active' and sets the right source_type so the ingest scheduler
-- pulls them. Run in Supabase SQL Editor. Idempotent.
-- ===========================================================

-- 1) HTML scraper sources -> type='scraper', status='active'
UPDATE opportunity_sources
SET source_type = 'scraper', source_status = 'active'
WHERE name IN (
  'DAAD Scholarships',
  'Chevening Scholarships',
  'Commonwealth Scholarships',
  'NHS Jobs International',
  'Make It In Germany',
  'Canada IRCC Express Entry',
  'UAE Golden Visa News',
  'LinkedIn Nigeria Remote',
  'TransferMarkt Africa Trials'
);

-- 2) RSS sources -> already type='rss', just activate
UPDATE opportunity_sources
SET source_status = 'active'
WHERE name IN (
  'Health Careers UK',
  'Jobberman International',
  'We Work Remotely',
  'Scholars4Dev Africa',
  'Opportunity Desk Scholarships'
);

-- 3) JSON-API sources -> already type='api', just activate
UPDATE opportunity_sources
SET source_status = 'active'
WHERE name IN (
  'Andela Network Jobs',
  'Remote OK Africa',
  'Contra Remote Jobs'
);

-- 4) Manual / curated-only sources stay pending_scraper (no scraper URL;
--    admin curates via paste-URL). Left unchanged on purpose.
--    (NurseConnect UAE, Right to Dream Africa, Canton Fair Registration,
--     GITEX Global)

-- 5) Verify
-- SELECT name, source_type, trust_tier, is_active, source_status
-- FROM opportunity_sources
-- WHERE source_status = 'active'
-- ORDER BY source_type, name;
