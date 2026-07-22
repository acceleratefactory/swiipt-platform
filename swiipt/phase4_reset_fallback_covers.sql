-- Phase 4: Reset cover_stored_at for fallback rows so the next
-- backfill run generates AI covers for them (via pollinations-cover.ts).
UPDATE opportunities
SET cover_stored_at = NULL
WHERE media_source = 'fallback'
  AND cover_image_url IS NULL;

-- Verify
SELECT COUNT(*) AS rows_to_backfill
FROM opportunities
WHERE cover_stored_at IS NULL
  AND media_source = 'fallback'
  AND cover_image_url IS NULL;
