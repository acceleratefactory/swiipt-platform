SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'evidence', 'source_health_log', 'page_hashes', 'partner_submissions',
  'opportunity_types', 'opportunity_signals', 'user_interest_model',
  'opportunity_comments', 'opportunity_queue', 'opportunity_sources',
  'feed_ads', 'ai_providers', 'opportunities', 'career_segments'
)
ORDER BY table_name;
