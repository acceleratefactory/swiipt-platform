-- pg_cron scheduled job to batch-compute interest models every 6 hours
-- Run this in Supabase SQL Editor after enabling the pg_cron extension
-- Requires: superset of compute-interest-batch route functionality

-- First, ensure pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule compute-interest-batch to run every 6 hours starting at midnight
SELECT cron.schedule(
  'compute-interest-batch',
  '0 */6 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.api_base_url') || '/api/opportunities/compute-interest-batch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', current_setting('app.settings.internal_api_secret')
    )
  ) AS request_id;$$
);

COMMENT ON FUNCTION cron.schedule IS 'Schedules compute-interest-batch to run every 6 hours. Requires net extension and app.settings to be configured.';
