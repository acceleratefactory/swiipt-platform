-- ============================================================
-- P0#4 — Cross-source dedupe (2026-07-17)
-- Problem (audit §1.2): the same opportunity posted on multiple sources
-- (Himalayas + RemoteOK + WeWorkRemotely) creates duplicate rows; and the
-- same item re-pulled with a changed timestamp creates infinite "new" items.
-- Fix: store a normalized_url (strip trackers/query noise, lowercase host,
--       drop trailing slash, http->https) on evidence + opportunities and
--       dedupe on it. Also a title+organisation fuzzy match as a backstop.
--
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

ALTER TABLE evidence
  ADD COLUMN IF NOT EXISTS normalized_url TEXT;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS normalized_url TEXT;

CREATE INDEX IF NOT EXISTS idx_evidence_normalized_url ON evidence (normalized_url);
CREATE INDEX IF NOT EXISTS idx_opportunities_normalized_url ON opportunities (normalized_url);

-- URL normalizer (mirrors src/lib/url-normalize.ts). Pure SQL so backfills
-- and triggers can use it.
CREATE OR REPLACE FUNCTION normalize_url(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  u TEXT;
  host TEXT;
  path TEXT;
  q TEXT;
  keep_q TEXT;
BEGIN
  IF input IS NULL OR input = '' THEN RETURN NULL; END IF;
  u := lower(trim(input));
  -- force https
  u := regexp_replace(u, '^http://', 'https://');
  -- strip fragment
  u := regexp_replace(u, '#.*$', '');
  -- parse host / path / query (substring returns text, no array indexing)
  host := substring(u from '^https://([^/]+)');
  path := COALESCE(substring(u from '^https://[^/]+(/[^?]*)'), '');
  q := COALESCE(substring(u from '\?([^#]*)'), '');
  -- keep only meaningful query keys (job/id/slug); drop trackers (utm_*, fbclid, ref, source)
  IF q <> '' THEN
    SELECT string_agg(kv, '&')
    INTO keep_q
    FROM (
      SELECT kv FROM unnest(string_to_array(q, '&')) AS kv
      WHERE split_part(kv, '=', 1) IN ('job','id','slug','jobId','vacancy','p','post')
    ) t;
    q := COALESCE(keep_q, '');
  END IF;
  -- drop trailing slash on path
  path := regexp_replace(path, '/+$', '');
  RETURN 'https://' || host || path || (CASE WHEN q <> '' THEN '?' || q ELSE '' END);
END;
$$;

-- One-time backfill of normalized_url for existing rows.
UPDATE evidence SET normalized_url = normalize_url(raw_data->>'url')
WHERE normalized_url IS NULL AND raw_data->>'url' IS NOT NULL;

UPDATE opportunities SET normalized_url = normalize_url(application_url)
WHERE normalized_url IS NULL AND application_url IS NOT NULL;

-- Verify:
-- SELECT normalized_url, COUNT(*) FROM opportunities WHERE normalized_url IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1;
