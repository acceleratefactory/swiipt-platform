-- pg_cron scheduled job to batch-compute interest models every 6 hours
-- Run this in Supabase SQL Editor after enabling the pg_cron extension

-- First, ensure pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule compute-interest-batch to run every 6 hours starting at midnight
SELECT cron.schedule(
  'compute-interest-batch'::text,
  '0 */6 * * *'::text,
  $$SELECT net.http_post(
    url := 'https://swiipt.com' || '/api/opportunities/compute-interest-batch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', 'swiipt-group-buy-secret-a1b2c3d4'
    )
  ) AS request_id;$$
);
