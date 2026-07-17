-- ============================================================
-- P0#5 — Language integrity (2026-07-17)
-- Audit §1.6: franc misclassifies short English as sco/und (kept as English,
-- OK) but a 24-char German title is marked 'und' and SHOWN in the feed. Also
-- the Session 46 add_opportunity_language.sql may not have been run in prod.
-- Fix: ensure language column exists; add a derived is_non_english flag for
-- fast filtering; add a stopword backstop at the code layer (language.ts).
--
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- Ensure the column + index exist (mirrors Session 46; safe if already run).
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS language TEXT;
CREATE INDEX IF NOT EXISTS idx_opportunities_language ON opportunities(language);

-- Convenience flag so the feed can filter without re-listing codes everywhere.
-- 'eng','sco','und' + NULL are treated as English/showable.
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS is_non_english BOOLEAN
  GENERATED ALWAYS AS (
    language IS NOT NULL AND language NOT IN ('eng', 'sco', 'und')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_opportunities_non_english
  ON opportunities (is_non_english);

-- Re-tag any rows that were detected as 'und' but are actually short/empty
-- (defensive; the backfill route handles real detection). No-op if correct.
-- (Detection itself runs in code: process-queue + backfill-language route.)

-- Verify:
-- SELECT language, is_non_english, COUNT(*) FROM opportunities GROUP BY 1,2;
