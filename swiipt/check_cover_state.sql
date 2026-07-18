SELECT media_source, count(*) FROM opportunities GROUP BY media_source;
SELECT count(*) AS stored_covers FROM opportunities WHERE cover_image_url LIKE '%/opportunity-covers/%';
SELECT id, cover_image_url, media_source FROM opportunities WHERE media_source = 'fetched' LIMIT 5;
