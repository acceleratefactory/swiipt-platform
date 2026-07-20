-- ============================================================
-- Register new dedicated scraper sources (2026-07-20)
-- Adds the 6+ new sources that have dedicated scrapers built
-- in src/lib/scrapers/*.ts
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- 1) Schwarzman Scholars
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Schwarzman Scholars', 'scraper', 'https://www.schwarzmanscholars.org/', 'student', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Schwarzman Scholars');

-- 2) UK Global Talent Visa
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'UK Global Talent Visa', 'scraper', 'https://www.gov.uk/global-talent-visa', 'job_seeker', 'trusted', 48, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'UK Global Talent Visa');

-- 3) EU Blue Card
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'EU Blue Card', 'scraper', 'https://ec.europa.eu/info/eu-blue-card_en', 'job_seeker', 'trusted', 48, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'EU Blue Card');

-- 4) Germany Opportunity Card
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Germany Opportunity Card', 'scraper', 'https://www.make-it-in-germany.com/en/visa-residence/employment/opportunity-card', 'job_seeker', 'trusted', 48, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Germany Opportunity Card');

-- 5) Canada Global Talent Stream
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Canada Global Talent Stream', 'scraper', 'https://www.canada.ca/en/employment-social-development/services/foreign-workers/global-talent.html', 'job_seeker', 'trusted', 48, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Canada Global Talent Stream');

-- 6) Australia Global Talent Visa
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Australia Global Talent Visa', 'scraper', 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/global-talent858', 'job_seeker', 'trusted', 48, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Australia Global Talent Visa');

-- 7) UN Volunteers
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'UN Volunteers', 'scraper', 'https://www.unv.org/volunteer-opportunities', 'job_seeker', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'UN Volunteers');

-- 8) WHO Internships
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'WHO Internships', 'scraper', 'https://www.who.int/careers/internship', 'healthcare', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'WHO Internships');

-- 9) UNESCO Internships
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'UNESCO Internships', 'scraper', 'https://careers.unesco.org/internship', 'student', 'trusted', 24, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'UNESCO Internships');

-- 10) Portugal D7 Visa
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Portugal D7 Visa', 'scraper', 'https://www.sef.pt/en/pages/conteudo-detalhe.aspx?nID=82', 'job_seeker', 'standard', 48, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Portugal D7 Visa');

-- 11) Spain Digital Nomad Visa
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours, is_active, source_status)
SELECT 'Spain Digital Nomad Visa', 'scraper', 'https://www.sepe.es/en/ciudadanos/detalle_ciudadano/detalle/visado-para-teletrabajo-de-caracter-internacional.html', 'job_seeker', 'standard', 48, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Spain Digital Nomad Visa');

-- Verify
-- SELECT name, source_type, source_status, is_active, segment_slug, trust_tier
-- FROM opportunity_sources
-- WHERE source_type = 'scraper' AND source_status = 'active'
-- ORDER BY name;
