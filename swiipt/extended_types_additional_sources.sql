-- ============================================================
-- Extended Types — Additional Sources
-- Supplements phase7 with more sources per type
-- Targets types with <3 sources (conference, contest, exchange,
-- residency, citizenship, accelerator, award, competition)
-- ============================================================

-- ─── CONFERENCES (was: 2, adding 4) ──────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Eventbrite Conferences', 'rss', 'https://www.eventbrite.com/rss/organizer/34658555/', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Eventbrite Conferences');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Lanyrd Conferences', 'rss', 'https://lanyrd.com/feed/', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Lanyrd Conferences');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Conference Service', 'rss', 'https://www.conference-service.com/rss.xml', 'student', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Conference Service');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'WikiCFP Academic', 'rss', 'http://www.wikicfp.com/cfp/rss', 'student', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'WikiCFP Academic');

-- ─── CONTESTS (was: 0, adding 5) ─────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Kaggle Competitions', 'rss', 'https://www.kaggle.com/competitions.json', 'tech_professional', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Kaggle Competitions');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Devpost Hackathons', 'rss', 'https://devpost.com/hackathons.rss', 'tech_professional', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Devpost Hackathons');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'ChallengeGov', 'rss', 'https://www.challenge.gov/feed/', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'ChallengeGov');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'HackerEarth Challenges', 'rss', 'https://www.hackerearth.com/blog/feed/', 'tech_professional', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'HackerEarth Challenges');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Devfolio Hackathons', 'rss', 'https://devfolio.co/blog/feed', 'tech_professional', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Devfolio Hackathons');

-- ─── COMPETITIONS (was: 3, adding 2) ─────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'InnoCentive Challenges', 'rss', 'https://www.innocentive.com/feed', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'InnoCentive Challenges');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'XPRIZE Competitions', 'rss', 'https://xprize.org/feed', 'entrepreneur', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'XPRIZE Competitions');

-- ─── EXCHANGE (was: 2, adding 2) ─────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Fulbright Exchange', 'rss', 'https://fulbrightprogram.org/feed', 'student', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Fulbright Exchange');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'CIEE Work Abroad', 'rss', 'https://www.ciee.org/feed', 'student', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'CIEE Work Abroad');

-- ─── RESIDENCY (was: 2, adding 2) ────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Internations Residency', 'rss', 'https://www.internations.org/feed', 'job_seeker', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Internations Residency');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'ExpatFocus Residency', 'rss', 'https://www.expatica.com/feed/', 'job_seeker', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'ExpatFocus Residency');

-- ─── CITIZENSHIP (was: 2, adding 2) ──────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'ImmigrantInvest', 'rss', 'https://immigrantinvest.com/feed/', 'job_seeker', 'standard', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'ImmigrantInvest');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'GlobalCitizen Solutions', 'rss', 'https://www.globalcitizensolutions.com/feed/', 'job_seeker', 'standard', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'GlobalCitizen Solutions');

-- ─── ACCELERATORS (was: 3, adding 2) ─────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Seedstars Startups', 'rss', 'https://seedstars.com/feed', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Seedstars Startups');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Startupbootcamp', 'rss', 'https://www.startupbootcamp.org/feed/', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Startupbootcamp');

-- ─── AWARDS (was: 2, adding 2) ───────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'European Design Awards', 'rss', 'https://www.europeandesignawards.com/feed', 'student', 'standard', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'European Design Awards');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'International Photography Awards', 'rss', 'https://www.photoawards.com/feed', 'student', 'standard', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'International Photography Awards');

-- ─── FUNDING (was: 3, adding 2) ──────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'European Commission Funding', 'rss', 'https://ec.europa.eu/info/funding-tenders/feed', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'European Commission Funding');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Open Society Foundations', 'rss', 'https://www.opensocietyfoundations.org/feed', 'entrepreneur', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Open Society Foundations');

-- Verify
-- SELECT name, source_type, segment_slug, trust_tier FROM opportunity_sources WHERE name LIKE '%Conferences%' OR name LIKE '%Contest%' OR name LIKE '%Challenge%' OR name LIKE '%Hackathon%' ORDER BY name;
