SELECT provider_slug, is_active, priority,
       length(coalesce(api_key,'')) AS key_len,
       left(coalesce(api_key,''),6) AS key_preview
FROM ai_providers
ORDER BY priority;
