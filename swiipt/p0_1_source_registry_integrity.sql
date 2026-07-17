-- ============================================================
-- P0#1 — Source registry integrity (2026-07-17)
-- Fix the "false confidence" problem: 14 seeded sources are marked
-- active + trusted but have NO adapter code, so they ingest 0 items.
-- We flag them as source_status='pending_scraper' so the ingest
-- scheduler skips them until a real scraper is built (follow-up A).
-- Rows are preserved — nothing is deleted or abandoned.
--
-- Run in Supabase SQL Editor. Idempotent (IF NOT EXISTS / WHERE).
-- ============================================================

-- 1) New status column. 'active' = has a working adapter and is pulled.
--    'pending_scraper' = source is valuable but no adapter exists yet.
ALTER TABLE opportunity_sources
  ADD COLUMN IF NOT EXISTS source_status TEXT NOT NULL DEFAULT 'active'
  CHECK (source_status IN ('active', 'pending_scraper', 'disabled'));

CREATE INDEX IF NOT EXISTS idx_opportunity_sources_status
  ON opportunity_sources (source_status);

-- 2) Flag the 14 adapter-less sources. These are the seeded sources whose
--    source_type has no code path in src/lib/api-adapters.ts / evidence-adapters.ts:
--      Andela Network Jobs (api, no adapter)
--      LinkedIn Nigeria Remote (scraper, no code)
--      Jobberman International (rss, no adapter)
--      Remote OK Africa (api, no adapter)
--      We Work Remotely (rss, no adapter)
--      DAAD Scholarships (scraper, no code)
--      Chevening Scholarships (scraper, no code)
--      Commonwealth Scholarships (scraper, no code)
--      Scholars4Dev Africa (rss, no adapter)
--      Opportunity Desk Scholarships (rss, no adapter)
--      NHS Jobs International (scraper, no code)
--      NurseConnect UAE (manual, no code)
--      Health Careers UK (rss, no adapter)
--      Make It In Germany (scraper, no code)
--      Canada IRCC Express Entry (scraper, no code)
--      UAE Golden Visa News (scraper, no code)
--      Right to Dream Africa (manual, no code)
--      TransferMarkt Africa Trials (scraper, no code)
--      Contra Remote Jobs (api, no adapter)
--      Canton Fair Registration (manual, no code)
--      GITEX Global (manual, no code)
--    (Himalayas, Arbeitnow, Adzuna, Jooble, USAJOBS, Findwork keep
--     source_status='active' — they have adapters, even if some need keys.)
UPDATE opportunity_sources
SET source_status = 'pending_scraper'
WHERE source_status = 'active'
  AND (
    source_type NOT IN ('rss', 'api')   -- scraper/manual/unknown: never handled
    OR name IN (
      'Andela Network Jobs',
      'Jobberman International',
      'Remote OK Africa',
      'We Work Remotely',
      'Scholars4Dev Africa',
      'Opportunity Desk Scholarships',
      'Health Careers UK',
      'Contra Remote Jobs'
    )
  );

-- 3) Verify
-- SELECT name, source_type, trust_tier, is_active, source_status
-- FROM opportunity_sources ORDER BY source_status, name;
