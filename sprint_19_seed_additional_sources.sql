-- Additional opportunity sources to reach 60+ total across all segments
DO $$
BEGIN
  -- Job seeker sources (existing: 5, adding: 7)
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'EuroJobs Africa') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours) VALUES
      ('EuroJobs Africa', 'rss', 'https://eurojobs.com/feed/africa', 'job_seeker', 'standard', 12),
      ('Hays Global Recruitment', 'rss', 'https://www.hays.com/feed/jobs', 'job_seeker', 'trusted', 12),
      ('Robert Half International', 'rss', 'https://www.roberthalf.com/feed/jobs', 'job_seeker', 'trusted', 12),
      ('Michael Page Africa', 'rss', 'https://www.michaelpage.africa/feed', 'job_seeker', 'standard', 12),
      ('Indeed Global Remote', 'scraper', 'https://www.indeed.com/q-remote-jobs.html', 'job_seeker', 'standard', 6),
      ('Glassdoor Remote Jobs', 'scraper', 'https://www.glassdoor.com/Job/remote-jobs', 'job_seeker', 'standard', 12),
      ('FlexJobs International', 'api', 'https://www.flexjobs.com/api/jobs', 'job_seeker', 'standard', 12);
  END IF;

  -- Tech professional sources (existing: 2, adding: 6)
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Stack Overflow Jobs') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours) VALUES
      ('Stack Overflow Jobs', 'api', 'https://stackoverflow.com/jobs/feed', 'tech_professional', 'trusted', 6),
      ('GitHub Jobs', 'api', 'https://jobs.github.com/positions.json', 'tech_professional', 'trusted', 6),
      ('AngelList Talent', 'scraper', 'https://angel.co/jobs', 'tech_professional', 'standard', 12),
      ('HN Who Is Hiring', 'scraper', 'https://news.ycombinator.com/submitted?id=whoishiring', 'tech_professional', 'trusted', 168),
      ('RemoteOK', 'api', 'https://remoteok.com/api', 'tech_professional', 'trusted', 6),
      ('Arc.dev', 'api', 'https://arc.dev/api/jobs', 'tech_professional', 'standard', 12);
  END IF;

  -- Student sources (existing: 5, adding: 6)
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'StudyPortals Scholarships') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours) VALUES
      ('StudyPortals Scholarships', 'api', 'https://www.scholarshipportal.com/feed', 'student', 'standard', 12),
      ('Scholarship Positions', 'rss', 'https://www.scholarshippositions.com/feed', 'student', 'standard', 12),
      ('MastersPortal', 'scraper', 'https://www.mastersportal.com/scholarships', 'student', 'standard', 24),
      ('British Council Scholarships', 'scraper', 'https://uk.britishcouncil.org/scholarships', 'student', 'trusted', 24),
      ('Fulbright Program', 'scraper', 'https://us.fulbrightonline.org/applicants', 'student', 'trusted', 24),
      ('Gates Cambridge', 'scraper', 'https://www.gatescambridge.org/apply', 'student', 'trusted', 24);
  END IF;

  -- Healthcare sources (existing: 3, adding: 6)
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Health Recruitment International') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours) VALUES
      ('Health Recruitment International', 'manual', '#', 'healthcare', 'standard', 24),
      ('Nursing Jobs Australia', 'scraper', 'https://www.nursingjobs.com.au', 'healthcare', 'standard', 12),
      ('Doctors Net UK', 'rss', 'https://www.doctors.net.uk/feed/jobs', 'healthcare', 'trusted', 12),
      ('Medacs Healthcare', 'rss', 'https://www.medacs.com/feed/jobs', 'healthcare', 'standard', 12),
      ('Pulse Jobs International', 'rss', 'https://www.pulsejobs.com/feed', 'healthcare', 'standard', 12),
      ('Allied Health Careers', 'scraper', 'https://www.alliedhealthcareers.com', 'healthcare', 'standard', 24);
  END IF;

  -- Entrepreneur sources (existing: 2, adding: 5)
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Y Combinator Startup School') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours) VALUES
      ('Y Combinator Startup School', 'manual', 'https://www.startupschool.org', 'entrepreneur', 'trusted', 168),
      ('Global Entrepreneurship Network', 'rss', 'https://www.genglobal.org/feed', 'entrepreneur', 'standard', 24),
      ('Ventures Platform', 'manual', 'https://venturesplatform.com/apply', 'entrepreneur', 'trusted', 168),
      ('Seedstars World', 'scraper', 'https://seedstars.com/competitions', 'entrepreneur', 'standard', 168),
      ('African Business Heroes', 'scraper', 'https://africanbusinessheroes.org/apply', 'entrepreneur', 'trusted', 168);
  END IF;

  -- Footballer sources (existing: 2, adding: 5)
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Scout7 Africa') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours) VALUES
      ('Scout7 Africa', 'manual', '#', 'footballer', 'standard', 168),
      ('World Football Academy Trials', 'manual', '#', 'footballer', 'standard', 168),
      ('Aspire Academy Qatar', 'manual', 'https://www.aspire.qa/trials', 'footballer', 'trusted', 168),
      ('IMG Academy Soccer', 'manual', 'https://www.imgacademy.com/sports/soccer', 'footballer', 'standard', 168),
      ('Global Football Trials UK', 'scraper', 'https://www.globalfootballtrials.com', 'footballer', 'standard', 168);
  END IF;

  -- Freelancer sources (existing: 2, adding: 5)
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Upwork Global') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours) VALUES
      ('Upwork Global', 'api', 'https://www.upwork.com/api/jobs', 'freelancer', 'standard', 6),
      ('Fiverr International', 'api', 'https://www.fiverr.com/api/jobs', 'freelancer', 'standard', 6),
      ('Freelancer Global', 'api', 'https://www.freelancer.com/api/jobs', 'freelancer', 'standard', 6),
      ('PeoplePerHour', 'scraper', 'https://www.peopleperhour.com', 'freelancer', 'standard', 12),
      ('Guru Remote Jobs', 'api', 'https://www.guru.com/api/jobs', 'freelancer', 'standard', 12);
  END IF;

  -- Trade worker sources (existing: 0, adding: 4)
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Trade Jobs Abroad') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours) VALUES
      ('Trade Jobs Abroad', 'scraper', 'https://www.tradejobsabroad.com', 'trade_worker', 'standard', 12),
      ('Construction Jobs International', 'rss', 'https://www.constructionjobs.com/feed', 'trade_worker', 'standard', 12),
      ('Skilled Trades Canada', 'scraper', 'https://www.skilledtrades.ca/jobs', 'trade_worker', 'standard', 12),
      ('Trades UK Visa Jobs', 'scraper', 'https://www.tradesukvisa.com', 'trade_worker', 'standard', 12);
  END IF;

  -- Visa / relocation sources (existing: 3, adding: 4)
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'VisaGuide World') THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours) VALUES
      ('VisaGuide World', 'manual', 'https://www.visaguide.world', 'job_seeker', 'standard', 48),
      ('DXB Express Visa', 'manual', '#', 'job_seeker', 'standard', 48),
      ('Australia Home Affairs', 'scraper', 'https://www.homeaffairs.gov.au/news', 'job_seeker', 'trusted', 24),
      ('UK Visas & Immigration', 'scraper', 'https://www.gov.uk/government/organisations/uk-visas-and-immigration', 'job_seeker', 'trusted', 24);
  END IF;
END $$;
