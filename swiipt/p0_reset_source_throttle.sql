-- ============================================================
-- Unstick the ingest throttle: reset every source's error counters and
-- degraded flag so they are pulled again on the next ingest run. The
-- circuit breaker is now time-based (recovers after 1h of no errors),
-- but existing sources are stuck degraded from prior runs — reset them.
-- Run in Supabase SQL Editor.
-- ============================================================

UPDATE opportunity_sources
SET consecutive_errors = 0,
    is_degraded = false,
    last_error = NULL,
    last_error_at = NULL,
    last_pulled_at = NULL;   -- force a pull on next ingest

-- Verify: should show 0 degraded, 0 errors.
SELECT is_degraded, count(*) AS n
FROM opportunity_sources
GROUP BY is_degraded;
