-- Cron: check all active opportunity links daily at 3am
-- Source: Sprint_19_Unified.md §B (lines 985-997) and §C.5 (lines 1814-1826)
SELECT cron.schedule(
  'check-opportunity-links',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://swiipt.com/api/admin/opportunities/check-links',
    headers := '{"x-internal-secret":"YOUR_SECRET"}',
    body := '{}'
  )
  $$
);
