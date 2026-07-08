-- Run this FIRST to check if media_source column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'opportunities'
AND column_name IN ('cover_image_url', 'media_source', 'media_type');
