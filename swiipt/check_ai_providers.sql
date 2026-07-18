SELECT provider_slug, is_active, priority,
       CASE WHEN api_key IS NOT NULL AND api_key <> '' THEN 'has_key' ELSE 'no_key' END AS key_status
FROM ai_providers
ORDER BY priority;
