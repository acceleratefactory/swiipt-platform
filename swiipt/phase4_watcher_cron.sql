-- ============================================================
-- Phase 4 — pg_cron: Run watcher every 24 hours
-- Calls the watcher API endpoint via net.http_post()
-- Requires pg_cron and pg_net extensions enabled in Supabase
-- ============================================================

-- Enable extensions if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule watcher to run every 24 hours at 02:00 UTC
SELECT cron.schedule(
  'watcher-page-change-detection',
  '0 2 * * *',
  $$
    SELECT net.http_post(
      url    := current_setting('app.settings.internal_api_url', true) || '/api/admin/opportunities/watcher',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', current_setting('app.settings.internal_api_secret', true)
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Verify: Run this to confirm the job is scheduled
-- SELECT * FROM cron.job WHERE jobname = 'watcher-page-change-detection';
