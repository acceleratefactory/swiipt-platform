SELECT source_type, COUNT(*) as total
FROM opportunity_sources
WHERE is_active = true
GROUP BY source_type
ORDER BY total DESC;
