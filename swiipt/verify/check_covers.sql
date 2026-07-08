-- Run these to see what's actually happening

-- 1. Check if cover_image_url is being set
SELECT id, title, LEFT(cover_image_url, 50) as cover_preview, media_source
FROM opportunities
WHERE is_active = true
LIMIT 10;

-- 2. Count how many have cover images vs NULL
SELECT
  CASE WHEN cover_image_url IS NULL THEN 'NULL' ELSE 'SET' END as status,
  COUNT(*)
FROM opportunities
WHERE is_active = true
GROUP BY status;

-- 3. Check column type and length
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'opportunities' AND column_name = 'cover_image_url';
