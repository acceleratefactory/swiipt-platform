SELECT cover_image_url FROM opportunities WHERE cover_image_url LIKE '%/opportunity-covers/%' LIMIT 1;
SELECT cover_image_url FROM opportunities WHERE media_source='fetched' AND cover_image_url LIKE 'http%' AND cover_image_url NOT LIKE '%/opportunity-covers/%' LIMIT 1;
