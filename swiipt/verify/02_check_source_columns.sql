SELECT column_name FROM information_schema.columns
WHERE table_name = 'opportunity_sources'
AND column_name IN (
  'consecutive_errors', 'last_error', 'is_degraded',
  'rate_limit_per_hour', 'rate_used_this_hour', 'rate_window_start', 'max_concurrent'
)
ORDER BY column_name;
