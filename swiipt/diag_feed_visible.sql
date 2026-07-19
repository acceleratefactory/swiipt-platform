-- ============================================================
-- Focused feed diagnostic: with 5,020 published opportunities, why
-- does the live feed look small? Break down by the exact feed filters:
--   is_active (expiry), is_non_english (language), language code.
-- Run in Supabase SQL Editor.
-- ============================================================

SELECT 'TOTAL opportunities' AS metric, count(*) AS n FROM opportunities;

SELECT is_active, count(*) AS n
FROM opportunities GROUP BY is_active ORDER BY is_active;

SELECT is_non_english, count(*) AS n
FROM opportunities GROUP BY is_non_english ORDER BY is_non_english;

SELECT language, count(*) AS n
FROM opportunities
WHERE language IS NOT NULL
GROUP BY language ORDER BY n DESC LIMIT 15;

-- What the feed would actually show (mirrors feed/route.ts filters):
SELECT count(*) AS feed_visible
FROM opportunities
WHERE is_active = true
  AND (is_non_english IS NOT TRUE)
  AND (language IS NULL OR language IN ('eng','sco','und'));
