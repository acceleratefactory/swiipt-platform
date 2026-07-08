-- ============================================
-- DELETE SEED OPPORTUNITIES
-- ============================================
-- Removes ALL seed/test opportunities.
-- Preserves sources so the pipeline can continue
-- fetching real data from RSS feeds.
-- ============================================

-- 1. Delete user feed associations FIRST (FK references opportunities)
DELETE FROM user_opportunity_feed;

-- 2. Delete opportunity signals (FK references opportunities)
DELETE FROM opportunity_signals;

-- 3. Delete all opportunities (seed + auto-published)
--    Pipeline will re-ingest from real sources on next cron run.
DELETE FROM opportunities;

-- 4. Clean up the queue (pending items from seed sources)
DELETE FROM opportunity_queue;

-- 4. Re-seed real opportunity sources (pipeline needs these)
--    These are REAL RSS/API feeds, not test data.

DO $$
BEGIN
  -- Job seeker sources
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Andela Network Jobs') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Andela Network Jobs', 'api', 'https://andela.com/jobs-feed.json', 'job_seeker', 'trusted', 6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Hays Global Recruitment') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Hays Global Recruitment', 'rss', 'https://www.hays.com/feed/jobs', 'job_seeker', 'trusted', 12);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Robert Half International') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Robert Half International', 'rss', 'https://www.roberthalf.com/feed/jobs', 'job_seeker', 'trusted', 12);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Indeed Global Remote') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Indeed Global Remote', 'scraper', 'https://www.indeed.com/q-remote-jobs.html', 'job_seeker', 'standard', 6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Make It In Germany') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Make It In Germany', 'scraper', 'https://www.make-it-in-germany.com/en/visa-residence/types/', 'job_seeker', 'trusted', 48);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Canada IRCC Express Entry') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Canada IRCC Express Entry', 'scraper', 'https://www.canada.ca/en/immigration-refugees-citizenship/news.html', 'job_seeker', 'trusted', 24);
  END IF;

  -- Tech professional sources
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Remote OK Africa') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Remote OK Africa', 'api', 'https://remoteok.com/remote-africa-jobs.json', 'tech_professional', 'trusted', 6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'We Work Remotely') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('We Work Remotely', 'rss', 'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss', 'tech_professional', 'trusted', 12);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Stack Overflow Jobs') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Stack Overflow Jobs', 'api', 'https://stackoverflow.com/jobs/feed', 'tech_professional', 'trusted', 6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'GitHub Jobs') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('GitHub Jobs', 'api', 'https://jobs.github.com/positions.json', 'tech_professional', 'trusted', 6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'RemoteOK') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('RemoteOK', 'api', 'https://remoteok.com/api', 'tech_professional', 'trusted', 6);
  END IF;

  -- Student sources
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Scholars4Dev Africa') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Scholars4Dev Africa', 'rss', 'https://www.scholars4dev.com/feed/', 'student', 'standard', 12);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Opportunity Desk Scholarships') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Opportunity Desk Scholarships', 'rss', 'https://opportunitydesk.org/category/scholarships/feed/', 'student', 'standard', 12);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'DAAD Scholarships') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('DAAD Scholarships', 'scraper', 'https://www.daad.de/en/study-and-research-in-germany/scholarships/', 'student', 'trusted', 24);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Chevening Scholarships') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Chevening Scholarships', 'scraper', 'https://www.chevening.org/scholarships/', 'student', 'trusted', 24);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Commonwealth Scholarships') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Commonwealth Scholarships', 'scraper', 'https://cscuk.fcdo.gov.uk/apply/', 'student', 'trusted', 24);
  END IF;

  -- Healthcare sources
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Health Careers UK') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Health Careers UK', 'rss', 'https://www.healthcareers.nhs.uk/feed', 'healthcare', 'trusted', 12);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'NHS Jobs International') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('NHS Jobs International', 'scraper', 'https://www.jobs.nhs.uk/candidate/search/results?keyword=nurse&location=&distance=50', 'healthcare', 'trusted', 6);
  END IF;

  -- Footballer sources
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Right to Dream Africa') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Right to Dream Africa', 'manual', 'https://www.righttodream.com/trials', 'footballer', 'trusted', 168);
  END IF;

  -- Freelancer sources
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Toptal Application') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Toptal Application', 'manual', 'https://www.toptal.com/talent/apply', 'freelancer', 'trusted', 168);
  END IF;

  -- Entrepreneur sources
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Canton Fair Registration') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('Canton Fair Registration', 'manual', 'https://www.cantonfair.org.cn/en-US', 'entrepreneur', 'trusted', 720);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'GITEX Global') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours)
    VALUES ('GITEX Global', 'manual', 'https://www.gitex.com/register', 'entrepreneur', 'trusted', 720);
  END IF;
END $$;

-- Done. Pipeline will re-ingest on next cron run.
