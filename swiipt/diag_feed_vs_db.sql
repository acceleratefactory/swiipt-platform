-- ============================================================
-- Diagnostic: how many opportunities actually exist, and are they
-- hidden by filters (is_non_english / is_active / expiry)?
-- Also: how much EVIDENCE backlog is stuck (not 'pending')?
-- Run in Supabase SQL Editor. Read-only.
-- ============================================================

SELECT 'OPPORTUNITIES' AS scope, count(*) AS total FROM opportunities;

SELECT
  is_active,
  count(*) AS n
FROM opportunities
GROUP BY is_active
ORDER BY is_active;

SELECT
  is_non_english,
  count(*) AS n
FROM opportunities
GROUP BY is_non_english
ORDER BY is_non_english;

-- Evidence backlog: process-queue only handles 'pending'. Anything else
-- (enriched / failed / processing) is stuck unless re-queued.
SELECT
  enrichment_status,
  count(*) AS n
FROM evidence
GROUP BY enrichment_status
ORDER BY enrichment_status;

-- How many EVIDENCE rows already have a linked opportunity
-- (i.e. were published at some point)?
SELECT
  CASE WHEN opportunity_id IS NULL THEN 'not_published' ELSE 'published' END AS state,
  count(*) AS n
FROM evidence
GROUP BY state;
