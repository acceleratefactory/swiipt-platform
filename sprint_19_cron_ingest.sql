-- Cron: ingest opportunities from RSS/API sources every 6 hours
-- Source: Sprint_19_Unified.md §C.5 (lines 1787-1799)
SELECT cron.schedule(
  'ingest-opportunities',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://swiipt.com/api/admin/opportunities/ingest',
    headers := '{"x-internal-secret":"YOUR_SECRET"}',
    body := '{}'
  )
  $$
);
