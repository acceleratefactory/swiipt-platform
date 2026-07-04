DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM opportunities WHERE type IN ('job', 'scholarship', 'visa_programme', 'sports_trial', 'remote_work', 'training') LIMIT 1) THEN
    INSERT INTO opportunities (
      segment_slug, title, organisation, location_country, location_city,
      type, description, requirements, salary_range, deadline, application_url,
      is_featured, related_service_slug, ai_generated, source_name
    ) VALUES
    -- Job seeker
    ('job_seeker', 'Software Engineer — Remote (USD Payroll)', 'Andela', 'USA', 'Remote',
     'job', 'Andela places African engineers in senior engineering roles at top US and European companies. Fully remote, USD payroll, benefits included.',
     'Minimum 3 years professional software engineering experience. Strong English communication. Portfolio required.',
     '$3,000–$8,000/month USD', '2026-09-30', 'https://andela.com/join-network',
     TRUE, 'uk-company-registration', FALSE, 'Andela'),
    ('job_seeker', 'Germany Opportunity Card — IT Professionals', 'Federal Employment Agency Germany', 'Germany', 'Multiple cities',
     'visa_programme', 'The Germany Chancenkarte (Opportunity Card) allows qualified IT professionals to live in Germany for 12 months while searching for employment. No job offer required.',
     'University degree in a STEM field. Minimum 60 months of relevant work experience OR degree with 3+ years experience. B1 German recommended but not required.',
     '€45,000–€80,000/year on placement', '2026-12-31', 'https://www.make-it-in-germany.com/en/visa-residence/types/opportunity-card',
     TRUE, 'germany-job-seeker-visa', FALSE, 'Make it in Germany'),
    ('job_seeker', 'UK Health and Care Worker Visa — Nurses Urgently Needed', 'NHS England', 'UK', 'Multiple NHS Trusts',
     'job', 'NHS Trusts across England are actively recruiting internationally trained nurses. Many trusts cover visa fees and offer relocation packages.',
     'Valid nursing degree. Current registration with NMCN. IELTS Academic 7.0+ in all components or OET B+. Active NMC registration or ability to obtain.',
     '£28,407–£34,581/year starting (Band 5)', '2026-12-31', 'https://www.nhscareers.nhs.uk',
     TRUE, 'uk-healthcare-nursing-jobs', FALSE, 'NHS England'),
    ('job_seeker', 'UAE Golden Visa — Professionals with Exceptional Talent', 'UAE GDRFA', 'UAE', 'Dubai / Abu Dhabi',
     'visa_programme', 'The UAE Golden Visa is available to professionals with exceptional talent in sciences, arts, and sports. 10-year renewable residency with no employer sponsorship required.',
     'Recognition from a relevant UAE authority or accredited organisation.',
     'Not salary-based — residency permit without employer tie', NULL, 'https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa',
     TRUE, 'uae-dubai-residency', FALSE, 'UAE Government'),

    -- Student
    ('student', 'Fully Funded Masters Scholarships — Germany (DAAD)', 'DAAD — German Academic Exchange Service', 'Germany', 'Multiple Universities',
     'scholarship', 'DAAD offers hundreds of fully funded scholarships for Nigerians to study in Germany. Covers tuition, living costs, health insurance, and flights.',
     'First degree with minimum Second Class Upper (2:1). 2 years relevant professional experience for most programmes. IELTS 6.5+ or TestDaF.',
     'Full tuition + €934/month stipend + health insurance + flights', '2027-01-31', 'https://www.daad.de/en/study-and-research-in-germany/scholarships',
     TRUE, 'germany-job-seeker-visa', FALSE, 'DAAD'),
    ('student', 'Chevening Scholarship — UK Government Full Funding', 'UK Foreign Commonwealth & Development Office', 'UK', 'Multiple Universities',
     'scholarship', 'Chevening is the UK Government flagship scholarship programme. Fully funded one-year Masters at any UK university. 1,500+ scholarships awarded annually.',
     'Undergraduate degree equivalent to UK 2:1. 2 years work experience. Leadership potential. English language requirement. Nigerian nationality.',
     'Full tuition + £1,393/month + flights + visa fee + thesis grant', '2026-11-05', 'https://www.chevening.org/scholarships/who-can-apply/nigeria',
     TRUE, 'uk-skilled-worker', FALSE, 'Chevening'),
    ('student', 'Commonwealth Masters and PhD Scholarships 2027', 'Commonwealth Scholarship Commission', 'UK', 'Multiple Universities',
     'scholarship', 'Commonwealth Shared Scholarships for high-achieving Nigerians at UK universities.',
     'Nigerian citizenship. First degree with minimum 2:1. Demonstrated need and development impact of study.',
     'Full tuition + £1,393/month + airfare + thesis allowance', '2026-12-19', 'https://cscuk.fcdo.gov.uk',
     FALSE, NULL, FALSE, 'Commonwealth Scholarship Commission'),
    ('student', 'Canadian Government Scholarships — Vanier Canada Graduate', 'Government of Canada', 'Canada', 'Multiple Universities',
     'scholarship', 'The Vanier Canada Graduate Scholarships Programme is awarded to doctoral students who demonstrate leadership skills.',
     'PhD enrolment at a Canadian university. Nominated by the institution. Exceptional academic achievement and leadership.',
     'CAD 50,000/year for 3 years', '2026-11-01', 'https://vanier.gc.ca',
     FALSE, 'canada-express-entry', FALSE, 'Government of Canada'),

    -- Footballer
    ('footballer', 'Open Trials — FC Nordsjaelland Right to Dream Academy', 'Right to Dream / FC Nordsjaelland', 'Denmark', 'Copenhagen',
     'sports_trial', 'Right to Dream runs the most successful African player pathway to European professional football. Open trials for ages 13-19 in Nigeria twice a year.',
     'Ages 13-19. Outstanding football ability. Academic willingness. Character and resilience as important as technical ability.',
     'Full scholarship if accepted. Pathway to professional contract.', '2026-08-15', 'https://www.righttodream.com',
     TRUE, 'uk-student-proof-of-funds', FALSE, 'Right to Dream'),
    ('footballer', 'Professional Trials — Swedish Allsvenskan Clubs', 'Football Agent Network Scandinavia', 'Sweden', 'Stockholm / Gothenburg',
     'sports_trial', 'Agent-coordinated trials with 6 clubs in the Swedish Allsvenskan (top division) for attacking midfielders and strikers aged 18-26.',
     'Ages 18-26. Verifiable playing history at semi-professional or professional level in Nigeria. Valid international passport.',
     'Contract negotiable — typically €800–€2,500/month + accommodation', '2026-09-30', '#',
     FALSE, 'uae-dubai-residency', FALSE, 'Swiipt Curated'),

    -- Healthcare
    ('healthcare', 'Canada Express Entry — Healthcare Professionals Priority Draw', 'IRCC Canada', 'Canada', 'Multiple Provinces',
     'visa_programme', 'Canada runs dedicated Express Entry draws for healthcare workers including nurses, doctors, physiotherapists, pharmacists, and medical laboratory scientists.',
     'Completed Canadian credential recognition (NNAS for nurses, MCC for doctors). Valid registration with provincial college. IELTS CLB 7+.',
     'Healthcare salary in Canada: CAD 60,000–$140,000/year depending on role', NULL, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html',
     TRUE, 'canada-express-entry', FALSE, 'IRCC'),
    ('healthcare', 'UAE Private Hospital Nurse Recruitment — Multiple Hospitals', 'NurseConnect UAE', 'UAE', 'Dubai / Abu Dhabi / Sharjah',
     'job', 'Private hospitals across the UAE are actively recruiting Nigerian and African nurses.',
     'Valid nursing degree. Current NMCN registration. Minimum 2 years clinical experience. IELTS 6.0+. Police clearance.',
     'AED 5,000–12,000/month + accommodation or accommodation allowance + annual flight', '2026-10-31', '#',
     TRUE, 'qatar-work-visa', FALSE, 'Swiipt Curated'),

    -- Tech professional
    ('tech_professional', 'Remote Senior Developer — European Startups (EUR Payroll)', 'Remotely', 'Multiple', 'Remote',
     'remote_work', 'Remotely places senior African developers at funded European startups. Fully remote, EUR payroll via your UK company, equity options available.',
     'Minimum 5 years professional development experience. Strong portfolio. Senior-level skills in React, Python, Node, or Go. Excellent English.',
     '€4,000–€9,000/month', NULL, 'https://remotely.works',
     TRUE, 'uk-company-registration', FALSE, 'Remotely'),
    ('tech_professional', 'Toptal Freelance Network — Top 3% of Tech Talent', 'Toptal', 'Global', 'Remote',
     'remote_work', 'Toptal accepts the top 3% of freelance tech talent globally. Once accepted, you access high-paying clients including Fortune 500 companies.',
     'Senior-level technical skills. Strong communication. Portfolio of production-level work. Ability to pass Toptal screening process.',
     '$60–$200/hour USD', NULL, 'https://www.toptal.com',
     FALSE, 'uk-company-registration', FALSE, 'Toptal'),

    -- Freelancer
    ('freelancer', 'Upwork Top Rated Plus — Guidance and Profile Optimisation', 'Upwork', 'Global', 'Remote',
     'training', 'A guided programme to reach Upwork Top Rated Plus status — the threshold that unlocks Enterprise-level clients and significantly higher earnings.',
     'Active Upwork account. Willingness to complete profile optimisation steps. UK company or US LLC for payment.',
     '$30–$150/hour once Top Rated achieved', NULL, 'https://www.upwork.com',
     FALSE, 'uk-company-registration', FALSE, 'Swiipt Curated'),

    -- Entrepreneur
    ('entrepreneur', 'Canton Fair October 2026 — Group Mission Available', 'Swiipt Trade Missions', 'China', 'Guangzhou',
     'training', 'Join Swiipt''s curated Nigerian SME delegation to the Canton Fair October 2026. Group visa processing, group hotel rates, sourcing agent, and post-fair freight support.',
     'Registered Nigerian business. CAC documents. Minimum $3,000 sourcing budget. Valid international passport.',
     'Trip cost: ₦850,000 per person in group (solo: ₦1,100,000)', '2026-09-01', '#',
     TRUE, 'canton-fair-china-sourcing', FALSE, 'Swiipt'),

    -- Trade worker
    ('trade_worker', 'UK Skilled Worker Visa — Shortage Occupations', 'UK Home Office', 'UK', 'Multiple Cities',
     'visa_programme', 'The UK Shortage Occupation List includes electricians, plumbers, welders, HGV drivers, and construction workers. These roles qualify for a Skilled Worker visa at reduced salary thresholds.',
     'Recognised trade qualification or equivalent experience. Job offer from a UK employer with a sponsorship licence.',
     '£28,000–£45,000/year depending on trade', NULL, 'https://www.gov.uk/skilled-worker-visa',
     FALSE, 'uk-skilled-worker', FALSE, 'UK Home Office');
  END IF;
END $$;
