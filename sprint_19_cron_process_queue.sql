-- Cron: process queue items through AI pipeline every 2 hours
-- Source: Sprint_19_Unified.md §C.5 (lines 1801-1812)
SELECT cron.schedule(
  'process-opportunity-queue',
  '30 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://swiipt.com/api/admin/opportunities/process-queue',
    headers := '{"x-internal-secret":"YOUR_SECRET"}',
    body := '{}'
  )
  $$
);
