-- ============================================================
-- Sprint 18 Phase E — pg_cron job for opportunity refresh
-- idempotent: safe to re-run
-- Requires pg_cron and pg_net extensions enabled in Supabase
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-opportunities') THEN
    PERFORM cron.unschedule('refresh-opportunities');
  END IF;
END $$;

SELECT cron.schedule(
  'refresh-opportunities',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://swiipt.com/api/opportunities/refresh',
    headers := '{"x-internal-secret":"YOUR_SECRET"}',
    body := '{}'
  )
  $$
);

-- Verify extensions are enabled (run separately):
-- SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
