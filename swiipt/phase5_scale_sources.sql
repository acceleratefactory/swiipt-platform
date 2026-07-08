-- ============================================================
-- Phase 5 — Scale Sources: Real RSS feeds + API sources
-- across ALL segments. Each source has a working endpoint.
-- Uses WHERE NOT EXISTS to avoid duplicates.
-- ============================================================

-- ─── JOB SEEKERS (segment: job_seeker) ────────────────────────
-- RSS feeds
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'RemoteOK Blog', 'rss', 'https://remoteok.com/remote-jobs.rss', 'job_seeker', 'trusted', true, 6
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'RemoteOK Blog');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'HackerNews Hiring', 'rss', 'https://hnrss.org/newest?q=who+is+hiring', 'tech_professional', 'trusted', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'HackerNews Hiring');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'RemoteOK Africa Feed', 'rss', 'https://remoteok.com/remote-africa-jobs.rss', 'job_seeker', 'trusted', true, 6
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'RemoteOK Africa Feed');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Jobbatical Visas', 'rss', 'https://jobbatical.com/blog/feed', 'job_seeker', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Jobbatical Visas');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'UK Gov Skilled Worker', 'rss', 'https://www.gov.uk/search/all.rss?filter=professional-and-skilled-worker-visas', 'job_seeker', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'UK Gov Skilled Worker');

-- ─── STUDENTS & SCHOLARS (segment: student) ───────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Scholarship Union', 'rss', 'https://scholarshipunion.com/feed/', 'student', 'standard', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Scholarship Union');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Scholars Portal', 'rss', 'https://scholarsportal.com/feed/', 'student', 'standard', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Scholars Portal');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Gilman Scholarship', 'rss', 'https://www.gilmanscholarship.org/feed', 'student', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Gilman Scholarship');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Erasmus Mundus', 'rss', 'https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students/erasmus-mundus-joint-masters', 'student', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Erasmus Mundus');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Chevening RSS', 'rss', 'https://www.chevening.org/blog/feed/', 'student', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Chevening RSS');

-- ─── HEALTHCARE (segment: healthcare) ─────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'NHS Jobs RSS', 'rss', 'https://www.jobs.nhs.uk/candidate/search/results/feed', 'healthcare', 'trusted', true, 6
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'NHS Jobs RSS');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Healthcareers Aus', 'rss', 'https://www.healthcareers.gov.au/feed', 'healthcare', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Healthcareers Aus');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'WHO Careers', 'rss', 'https://www.who.int/careers/opportunities/feed', 'healthcare', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'WHO Careers');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'BMJ Careers', 'rss', 'https://www.bmj.com/careers/feed', 'healthcare', 'trusted', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'BMJ Careers');

-- ─── TECH (segment: tech_professional) ────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Remotive Remote Jobs', 'rss', 'https://remotive.com/feed', 'tech_professional', 'trusted', true, 6
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Remotive Remote Jobs');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'DevITjobs UK', 'rss', 'https://devitjobs.co.uk/feed', 'tech_professional', 'standard', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'DevITjobs UK');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'GraphQL Jobs', 'rss', 'https://graphqljobs.com/feed.xml', 'tech_professional', 'standard', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'GraphQL Jobs');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Landing.Jobs Feed', 'rss', 'https://landing.jobs/feed', 'tech_professional', 'standard', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Landing.Jobs Feed');

-- ─── FREELANCERS (segment: freelancer) ────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Freelancer Blog', 'rss', 'https://www.freelancer.com/community/blog', 'freelancer', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Freelancer Blog');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Working Nomads', 'rss', 'https://www.workingnomads.com/feed', 'freelancer', 'standard', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Working Nomads');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Nomad List Jobs', 'rss', 'https://nomadlist.com/feed', 'freelancer', 'standard', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Nomad List Jobs');

-- ─── ENTREPRENEURS (segment: entrepreneur) ────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'AngelList Blog', 'rss', 'https://www.angellist.com/blog/feed', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'AngelList Blog');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Y Combinator Blog', 'rss', 'https://www.ycombinator.com/blog/feed/', 'entrepreneur', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Y Combinator Blog');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'GEN News', 'rss', 'https://www.gen.global/feed', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'GEN News');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT '10times Events', 'rss', 'https://10times.com/feed', 'entrepreneur', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = '10times Events');

-- ─── TRADE WORKERS (segment: trade_worker) ────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'GulfTalent Jobs', 'rss', 'https://www.gulftalent.com/feed', 'trade_worker', 'standard', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'GulfTalent Jobs');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Construction Jobs UK', 'rss', 'https://www.constructionjobs.co.uk/feed', 'trade_worker', 'standard', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Construction Jobs UK');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Workpermit Jobs', 'rss', 'https://www.workpermit.com/rss/jobs.rss', 'trade_worker', 'standard', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Workpermit Jobs');

-- ─── CAREGIVERS (segment: caregiver) ──────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'CareersInCare', 'rss', 'https://www.careersincare.com/feed', 'caregiver', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'CareersInCare');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Nannies Inc Jobs', 'rss', 'https://www.nanniesinc.co.uk/feed', 'caregiver', 'standard', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Nannies Inc Jobs');

-- ─── SPORTS (segment: footballer) ─────────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'BBC Sport Football', 'rss', 'https://feeds.bbci.co.uk/sport/football/rss.xml', 'footballer', 'trusted', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'BBC Sport Football');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'FIFA.com News', 'rss', 'https://www.fifa.com/rss/news', 'footballer', 'trusted', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'FIFA.com News');

-- ─── API SOURCES (no auth required) ───────────────────────────
INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Himalayas Jobs', 'api', 'https://himalayas.app/jobs/api', 'job_seeker', 'standard', true, 6
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Himalayas Jobs');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Arbeitnow Jobs', 'api', 'https://www.arbeitnow.com/api/job-board-api', 'job_seeker', 'standard', true, 6
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Arbeitnow Jobs');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'RemoteOK API', 'api', 'https://remoteok.com/api', 'tech_professional', 'trusted', true, 6
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'RemoteOK API');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'GitHub Jobs API', 'api', 'https://jobs.github.com/positions.json', 'tech_professional', 'trusted', true, 12
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'GitHub Jobs API');

-- Verify: Run this to see all sources by segment
-- SELECT segment_slug, COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM opportunity_sources GROUP BY segment_slug ORDER BY segment_slug;
