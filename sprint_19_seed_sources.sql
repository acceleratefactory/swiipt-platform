DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM opportunity_sources LIMIT 1) THEN
    INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, pull_frequency_hours) VALUES
      ('Andela Network Jobs', 'api', 'https://andela.com/jobs-feed.json', 'job_seeker', 'trusted', 6),
      ('LinkedIn Nigeria Remote', 'scraper', 'https://www.linkedin.com/jobs/search/?keywords=remote+nigeria&location=Nigeria', 'job_seeker', 'standard', 12),
      ('Jobberman International', 'rss', 'https://www.jobberman.com/feed/international', 'job_seeker', 'standard', 12),
      ('Remote OK Africa', 'api', 'https://remoteok.com/remote-africa-jobs.json', 'tech_professional', 'trusted', 6),
      ('We Work Remotely', 'rss', 'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss', 'tech_professional', 'trusted', 12),
      ('DAAD Scholarships', 'scraper', 'https://www.daad.de/en/study-and-research-in-germany/scholarships/', 'student', 'trusted', 24),
      ('Chevening Scholarships', 'scraper', 'https://www.chevening.org/scholarships/', 'student', 'trusted', 24),
      ('Commonwealth Scholarships', 'scraper', 'https://cscuk.fcdo.gov.uk/apply/', 'student', 'trusted', 24),
      ('Scholars4Dev Africa', 'rss', 'https://www.scholars4dev.com/feed/', 'student', 'standard', 12),
      ('Opportunity Desk Scholarships', 'rss', 'https://opportunitydesk.org/category/scholarships/feed/', 'student', 'standard', 12),
      ('NHS Jobs International', 'scraper', 'https://www.jobs.nhs.uk/candidate/search/results?keyword=nurse&location=&distance=50', 'healthcare', 'trusted', 6),
      ('NurseConnect UAE', 'manual', '#', 'healthcare', 'standard', 24),
      ('Health Careers UK', 'rss', 'https://www.healthcareers.nhs.uk/feed', 'healthcare', 'trusted', 12),
      ('Make It In Germany', 'scraper', 'https://www.make-it-in-germany.com/en/visa-residence/types/', 'job_seeker', 'trusted', 48),
      ('Canada IRCC Express Entry', 'scraper', 'https://www.canada.ca/en/immigration-refugees-citizenship/news.html', 'job_seeker', 'trusted', 24),
      ('UAE Golden Visa News', 'scraper', 'https://u.ae/en/information-and-services/visa-and-emirates-id/', 'job_seeker', 'trusted', 48),
      ('Right to Dream Africa', 'manual', 'https://www.righttodream.com/trials', 'footballer', 'trusted', 168),
      ('TransferMarkt Africa Trials', 'scraper', 'https://www.transfermarkt.com/transfers/einzel/statistik', 'footballer', 'standard', 24),
      ('Toptal Application', 'manual', 'https://www.toptal.com/talent/apply', 'freelancer', 'trusted', 168),
      ('Contra Remote Jobs', 'api', 'https://contra.com/api/jobs', 'freelancer', 'standard', 12),
      ('Canton Fair Registration', 'manual', 'https://www.cantonfair.org.cn/en-US', 'entrepreneur', 'trusted', 720),
      ('GITEX Global', 'manual', 'https://www.gitex.com/register', 'entrepreneur', 'trusted', 720);
  END IF;
END $$;
