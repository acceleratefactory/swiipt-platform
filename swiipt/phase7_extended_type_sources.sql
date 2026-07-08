-- ============================================================
-- Phase 7 — Sources for Extended Types
-- Adds RSS/API sources targeting the 12 extended opportunity types
-- ============================================================

-- ─── COMPETITIONS ─────────────────────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Hult Prize', 'rss', 'https://www.hultprize.org/feed', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Hult Prize');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT ' competitions.org', 'rss', 'https://www.competitions.org/feed', 'student', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = ' competitions.org');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Challenge.org', 'rss', 'https://www.challenge.org/feed', 'student', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Challenge.org');

-- ─── CONFERENCES ──────────────────────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Conference Alerts', 'rss', 'https://www.conferencealerts.com/feed', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Conference Alerts');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'All Conference Alert', 'rss', 'https://www.allconferencealert.com/rss', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'All Conference Alert');

-- ─── EXCHANGE PROGRAMMES ──────────────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Erasmus+ Programme', 'rss', 'https://erasmus-plus.ec.europa.eu/rss', 'student', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Erasmus+ Programme');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Work Abroad Exchange', 'rss', 'https://www.workabroad.ph/feed', 'job_seeker', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Work Abroad Exchange');

-- ─── TRADE SHOWS ──────────────────────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT '10times Trade Shows', 'rss', 'https://10times.com/feed', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = '10times Trade Shows');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Trade Show News', 'rss', 'https://www.tradeshownews.com/feed', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Trade Show News');

-- ─── RESIDENCY PROGRAMMES ────────────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Henley & Partners', 'rss', 'https://www.henleyglobal.com/feed', 'job_seeker', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Henley & Partners');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Visa Residency News', 'rss', 'https://www.visaresidency.com/feed', 'job_seeker', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Visa Residency News');

-- ─── CITIZENSHIP ──────────────────────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Citizenship by Investment', 'rss', 'https://www.citizenshipbyinvestment.com/feed', 'job_seeker', 'standard', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Citizenship by Investment');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Passport Index News', 'rss', 'https://www.passportindex.org/feed', 'job_seeker', 'standard', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Passport Index News');

-- ─── FUNDING & GRANTS ────────────────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Grants.gov', 'rss', 'https://www.grants.gov/rss/search', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Grants.gov');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'FundsforNGOs', 'rss', 'https://www.fundsforngos.org/feed/', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'FundsforNGOs');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Devex Funding', 'rss', 'https://www.devex.com/news/feed', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Devex Funding');

-- ─── ACCELERATORS ─────────────────────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Y Combinator Blog', 'rss', 'https://www.ycombinator.com/blog/feed/', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Y Combinator Blog');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Techstars Blog', 'rss', 'https://www.techstars.com/blogs/feed', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Techstars Blog');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT '500 Startups', 'rss', 'https://500.co/feed/', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = '500 Startups');

-- ─── AWARDS ───────────────────────────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'AwardHub', 'rss', 'https://www.awardhub.org/feed', 'student', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'AwardHub');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'International Awards', 'rss', 'https://www.international-awards.com/feed', 'student', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'International Awards');

-- Verify: Run this to see sources by type coverage
-- SELECT source_type, COUNT(*) as total FROM opportunity_sources WHERE is_active = true GROUP BY source_type ORDER BY total DESC;
