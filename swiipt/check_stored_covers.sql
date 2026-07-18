SELECT count(*) AS stored_covers FROM opportunities WHERE cover_image_url LIKE '%/opportunity-covers/%';
SELECT count(*) AS external_fetched FROM opportunities WHERE media_source='fetched' AND cover_image_url LIKE 'http%' AND cover_image_url NOT LIKE '%/opportunity-covers/%';
SELECT count(*) AS fallback_rows FROM opportunities WHERE media_source='fallback';
