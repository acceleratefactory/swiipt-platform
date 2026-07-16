-- Session 46 — Non-English opportunity filtering (Fix "filter now").
-- Adds a detected-language column so the feed can hide non-English listings
-- (e.g. German Arbeitnow jobs). Populated at ingest (process-queue) and by the
-- one-time backfill route POST /api/admin/opportunities/backfill-language.
--
-- Values are ISO 639-3 codes from `franc` (e.g. "eng", "deu", "fra") or "und"
-- (undetermined / too short to detect). NULL means "not yet detected".
-- The feed keeps rows where language IS NULL OR language IN ('eng','sco','und')
-- and hides everything else.

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS language TEXT;

CREATE INDEX IF NOT EXISTS idx_opportunities_language ON opportunities(language);
