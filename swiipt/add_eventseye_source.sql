-- Add EventsEye Trade Shows as a scraper source (2026-07-20)
-- The scraper in 10times.ts uses eventseye.com as its primary data source
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'EventsEye Trade Shows', 'scraper', 'https://www.eventseye.com/fairs/d1_trade-shows_august_0.html', 'job_seeker', 'standard', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'EventsEye Trade Shows');
