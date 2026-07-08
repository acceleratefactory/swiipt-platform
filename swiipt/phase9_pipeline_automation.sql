-- ============================================================
-- Phase 9 — Pipeline Automation: pg_cron jobs
-- Ingest every 6 hours, process-queue every hour,
-- auto-downgrade weekly, reprocess failed daily
-- Requires pg_cron and pg_net extensions enabled in Supabase
-- ============================================================

-- Enable extensions if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Ingest sources every 6 hours (at :00)
SELECT cron.schedule(
  'pipeline-ingest',
  '0 */6 * * *',
  $$
    SELECT net.http_post(
      url    := current_setting('app.settings.internal_api_url', true) || '/api/admin/opportunities/ingest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', current_setting('app.settings.internal_api_secret', true)
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 2. Process queue every hour (at :15)
SELECT cron.schedule(
  'pipeline-process-queue',
  '15 * * * *',
  $$
    SELECT net.http_post(
      url    := current_setting('app.settings.internal_api_url', true) || '/api/admin/opportunities/process-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', current_setting('app.settings.internal_api_secret', true)
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 3. Auto-downgrade source trust tier weekly (Sunday 03:00 UTC)
SELECT cron.schedule(
  'pipeline-auto-downgrade',
  '0 3 * * 0',
  $$
    SELECT net.http_post(
      url    := current_setting('app.settings.internal_api_url', true) || '/api/admin/sources/auto-downgrade',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', current_setting('app.settings.internal_api_secret', true)
      ),
      body := '{}'::jsonb
    );
  $$
);

-- 4. Reprocess failed evidence daily (04:00 UTC)
SELECT cron.schedule(
  'pipeline-reprocess-failed',
  '0 4 * * *',
  $$
    SELECT net.http_post(
      url    := current_setting('app.settings.internal_api_url', true) || '/api/admin/evidence/reprocess',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', current_setting('app.settings.internal_api_secret', true)
      ),
      body := '{"limit": 50}'::jsonb
    );
  $$
);

-- Verify: Run this to confirm all jobs are scheduled
-- SELECT jobname, schedule, command FROM cron.job ORDER BY jobname;
