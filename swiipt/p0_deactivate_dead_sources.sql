-- ============================================================
-- Deactivate the dead / wrong-URL sources we confirmed return
-- HTML pages or 404 (not real feeds). This stops them erroring on
-- every ingest and polluting source-health. Valuable ones that need
-- custom work (Grants.gov POST API) are left active for later.
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

UPDATE opportunity_sources
SET is_active = false, source_status = 'pending_scraper'
WHERE name IN (
  'XPRIZE Competitions',
  'Lanyrd Conferences',
  '500 Startups',
  'Nomad List Jobs',
  'Erasmus Mundus',
  'Erasmus+ Programme',
  'Grants.gov'          -- needs custom POST API adapter; disable until built
);

-- Verify
SELECT name, source_type, is_active, source_status
FROM opportunity_sources
WHERE name IN (
  'XPRIZE Competitions','Lanyrd Conferences','500 Startups','Nomad List Jobs',
  'Erasmus Mundus','Erasmus+ Programme','Grants.gov'
);
