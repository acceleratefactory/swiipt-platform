-- ============================================================
-- VERIFICATION QUERIES — Run ALL of these in Supabase SQL Editor
-- Paste results back to me to confirm everything is set up
-- ============================================================

-- 1. Check all required tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'evidence', 'source_health_log', 'page_hashes', 'partner_submissions',
  'opportunity_types', 'opportunity_signals', 'user_interest_model',
  'opportunity_comments', 'opportunity_queue', 'opportunity_sources',
  'feed_ads', 'ai_providers', 'opportunities', 'career_segments'
)
ORDER BY table_name;

-- 2. Check opportunity_sources has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'opportunity_sources'
AND column_name IN (
  'consecutive_errors', 'last_error', 'is_degraded',
  'rate_limit_per_hour', 'rate_used_this_hour', 'rate_window_start', 'max_concurrent'
)
ORDER BY column_name;

-- 3. Count sources by type
SELECT source_type, COUNT(*) as total
FROM opportunity_sources
WHERE is_active = true
GROUP BY source_type
ORDER BY total DESC;

-- 4. Check ai_providers has gemini active
SELECT provider_slug, is_active, priority FROM ai_providers ORDER BY priority;

-- 5. Check all 21 extended types exist
SELECT slug, name, emoji FROM opportunity_types ORDER BY sort_order;

-- 6. Check opportunities CHECK constraint includes all 21 types
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'opportunities_type_check';

-- 7. Count existing opportunities
SELECT COUNT(*) as total_opportunities FROM opportunities;

-- 8. Check evidence table exists and has columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'evidence'
ORDER BY ordinal_position;

-- 9. Check page_hashes table exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'page_hashes'
ORDER BY ordinal_position;

-- 10. Check partner_submissions table exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'partner_submissions'
ORDER BY ordinal_position;
