DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM opportunities WHERE source_name IN ('Automattic Careers', 'Paystack Careers', 'Lloyds Careers', 'HSE Ireland', 'Aster Healthcare', 'European Commission', 'Australian Government', 'MasterCard Foundation', 'Zalando Careers', 'Fora Travel', 'FC Midtjylland', 'Tony Elumelu Foundation', 'IRCC Canada', 'Portugal IAPMEI', 'Ontario OINP', 'Deel')) THEN
    INSERT INTO opportunities (
      segment_slug, title, organisation, location_country, location_city,
      type, description, requirements, salary_range, deadline, application_url,
      is_featured, source_name, ai_generated, ai_relevance_score, is_active
    ) VALUES

    -- Job seekers
    ('job_seeker', 'Software Engineer — Remote First (USD Salary)', 'Automattic (WordPress)', 'USA', 'Remote',
     'remote_work',
     'Automattic builds WordPress, Tumblr, and WooCommerce. Fully distributed company — no offices. Engineers set their own hours. USD payroll to any country. Strong culture of writing and async work.',
     'Demonstrated software engineering experience. Strong written communication. Proficiency in JavaScript, PHP, or relevant stack. Portfolio of shipped work.',
     '$80,000–$160,000/year USD', '2026-12-31', 'https://automattic.com/work-with-us/', FALSE, 'Automattic Careers', FALSE, 88, TRUE),

    ('job_seeker', 'Backend Engineer — Remote (Africa-Friendly Timezone)', 'Paystack', 'Nigeria', 'Remote',
     'remote_work',
     'Paystack is Africa''s leading payments company (owned by Stripe). Engineering roles are remote-friendly with a strong African engineering culture. USD-denominated compensation.',
     'Strong backend engineering skills. Experience with distributed systems. Ideally 3+ years professional experience.',
     '$60,000–$120,000/year USD', '2026-12-31', 'https://paystack.com/jobs', FALSE, 'Paystack Careers', FALSE, 91, TRUE),

    ('job_seeker', 'Data Analyst — UK Skilled Worker Visa Sponsored', 'Lloyds Banking Group', 'UK', 'London',
     'job',
     'Lloyds Banking Group is one of the UK''s largest financial institutions. Data and analytics roles are actively sponsored for international applicants. Competitive salary plus London weighting.',
     'Degree in quantitative field. 2+ years data analysis experience. SQL proficiency. IELTS 6.0+. Eligibility to work in UK or visa sponsorship required.',
     '£45,000–£65,000/year + benefits', '2026-09-30', 'https://www.lloydsbankinggroup.com/careers.html', FALSE, 'Lloyds Careers', FALSE, 82, TRUE),

    -- Healthcare
    ('healthcare', 'Registered Nurse — Ireland HSE (Visa Sponsored)', 'Health Service Executive Ireland', 'Ireland', 'Dublin',
     'job',
     'Ireland''s national health system is actively recruiting internationally trained nurses. Critical Skills Employment Permit available for nurses. Competitive Irish salary plus relocation support in many cases.',
     'NMBI registration or eligibility. IELTS 7.0+ overall (no band below 6.5). Minimum 2 years post-registration experience. Nigerian or African qualifications accepted.',
     '€36,000–€51,000/year', '2026-12-31', 'https://www.hse.ie/eng/staff/jobs/nursing/', TRUE, 'HSE Ireland', FALSE, 89, TRUE),

    ('healthcare', 'Pharmacist — UAE MOH Licensed (Full Relocation Package)', 'Aster DM Healthcare', 'UAE', 'Dubai',
     'job',
     'Aster DM is one of the largest healthcare providers in the UAE and GCC. Pharmacist roles come with UAE MOH licence sponsorship, accommodation allowance, and annual flight home.',
     'B.Pharm or Pharm.D degree. PCN (Nigeria) registration. 2+ years hospital or clinical pharmacy experience. IELTS 6.0+. UAE MOH licence obtained after arrival (sponsored).',
     'AED 7,000–12,000/month + accommodation + annual flight', '2026-10-31', 'https://www.asterhospitals.in/careers', FALSE, 'Aster Healthcare', FALSE, 86, TRUE),

    -- Students
    ('student', 'Erasmus Mundus Joint Master Degrees — Fully Funded (EU)', 'European Commission', 'Multiple', 'Multiple EU cities',
     'scholarship',
     'Erasmus Mundus scholarships fully fund Masters degrees at two or more European universities. Approximately 300 programmes available. Scholarship covers tuition, monthly stipend (€1,000–€1,500), travel and installation costs.',
     'Bachelor degree (2:1 or above). English or French language proficiency. Each programme has specific field requirements. Nigerian citizens are eligible.',
     'Full tuition + €1,000–€1,500/month + travel allowance', '2027-01-15', 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en', TRUE, 'European Commission', FALSE, 93, TRUE),

    ('student', 'Australia Awards Scholarships — Full Funding for African Students', 'Australian Government DFAT', 'Australia', 'Multiple Universities',
     'scholarship',
     'Australia Awards Scholarships provide full funding for Nigerians and other African nationals to undertake degree, Masters, or PhD studies in Australia. Includes full tuition, return airfare, living allowance, and health insurance.',
     'Nigerian citizen. Minimum 2 years professional experience. Bachelor degree. IELTS 6.5+ (no band below 6.0). Not currently studying in Australia.',
     'Full tuition + AUD 35,000/year living + airfare + health insurance', '2027-04-30', 'https://www.australiaawards.gov.au/home', TRUE, 'Australian Government', FALSE, 91, TRUE),

    ('student', 'MasterCard Foundation Scholars Program — African Universities', 'MasterCard Foundation', 'Multiple', 'Multiple African Countries',
     'scholarship',
     'The MasterCard Foundation Scholars Program supports academically talented yet economically disadvantaged young Africans through full scholarships at leading African and international partner universities.',
     'Academically gifted. Demonstrates financial need. Proven leadership. Commitment to return and contribute to Africa. Specific universities: USIU-A, University of Pretoria, and others.',
     'Full tuition + accommodation + stipend + mentorship', '2027-02-28', 'https://mastercardfdn.org/programs/', FALSE, 'MasterCard Foundation', FALSE, 87, TRUE),

    -- Tech professionals
    ('tech_professional', 'Machine Learning Engineer — Remote (EU Company)', 'Zalando SE', 'Germany', 'Remote / Berlin',
     'job',
     'Zalando is Europe''s largest online fashion platform, headquartered in Berlin. ML Engineering roles are remote-first with the option to work from Berlin. EUR salary paid to any account.',
     'Strong ML engineering background. Experience with Python, TensorFlow or PyTorch. Production ML systems experience. 3+ years relevant experience.',
     '€80,000–€130,000/year EUR', '2026-12-31', 'https://jobs.zalando.com/en/tech', FALSE, 'Zalando Careers', FALSE, 84, TRUE),

    ('tech_professional', 'Product Manager — Remote (US-Based Tech Company)', 'Fora Travel', 'USA', 'Remote',
     'remote_work',
     'Fora is a travel startup backed by Y Combinator. Product management roles are fully remote. USD payroll via registered business entity in any country.',
     '3+ years product management experience. Strong analytical skills. Experience in marketplace or B2B SaaS. Excellent English writing skills.',
     '$90,000–$130,000/year USD', '2026-09-30', 'https://www.foratravel.com/careers', FALSE, 'Fora Travel', FALSE, 80, TRUE),

    -- Footballers
    ('footballer', 'Academy Trials — FC Midtjylland Global Scouting', 'FC Midtjylland', 'Denmark', 'Herning',
     'sports_trial',
     'FC Midtjylland runs the most data-driven scouting operation in European football. They actively recruit from African markets. Successful trialists join their development pathway which has produced players now in Premier League and Bundesliga.',
     'Ages 16-22. Strong technical foundation. High physical attributes. Previous club history (any level). Video highlights essential for initial screening.',
     'Academy scholarship if selected. Development contract pathway to professional deal.', '2026-09-30', 'https://www.fcm.dk/en/club/academy', FALSE, 'FC Midtjylland', FALSE, 85, TRUE),

    -- Entrepreneurs
    ('entrepreneur', 'Tony Elumelu Foundation Entrepreneurship Programme 2027', 'Tony Elumelu Foundation', 'Nigeria', 'Lagos (+ pan-Africa)',
     'grant',
     'The TEF Programme is the largest entrepreneurship programme in Africa. Each of the 1,000 selected entrepreneurs receives a non-refundable $5,000 seed capital, $5,000 in business training, and mentorship.',
     'African entrepreneur. Business idea or early-stage business. Under 35 years old preferred. Not a previously funded TEF beneficiary.',
     '$5,000 non-refundable grant + $5,000 training + mentorship', '2027-02-28', 'https://www.tefconnect.com', TRUE, 'Tony Elumelu Foundation', FALSE, 92, TRUE),

    -- Visa programmes
    ('job_seeker', 'Canada Tech Talent Strategy — Dedicated Tech Visa Pathway', 'Immigration, Refugees and Citizenship Canada', 'Canada', 'Multiple Cities',
     'visa_programme',
     'Canada''s Tech Talent Strategy provides dedicated pathways for technology workers. Work permits processed in as little as 2 weeks for eligible applicants. Targets software engineers, data scientists, and cybersecurity professionals.',
     'Job offer from Canadian employer OR skills in eligible NOC codes. IELTS CLB 7+. University degree or equivalent experience in tech.',
     'Varies by role. Canadian tech salaries average CAD 90,000–140,000/year', NULL, 'https://www.canada.ca/en/immigration-refugees-citizenship/news/2023/06/canada-launches-new-tech-talent-strategy.html', FALSE, 'IRCC Canada', FALSE, 88, TRUE),

    ('job_seeker', 'Portugal Tech Visa — For Startups and Tech Professionals', 'IAPMEI Portugal', 'Portugal', 'Lisbon',
     'visa_programme',
     'Portugal''s Tech Visa is designed for tech professionals and startup founders. Faster processing than standard visas. Gateway to EU permanent residence after 5 years. Lisbon has a thriving tech and startup ecosystem.',
     'Tech professional with job offer in Portugal, OR startup founder with business plan. English is widely spoken in Portuguese tech. No Portuguese required initially.',
     'Varies. Portuguese tech salaries €30,000–60,000/year. Lower cost of living than UK or Germany.', NULL, 'https://www.iapmei.pt/getattachment/Paginas/Tech-Visa/Tech-Visa-EN.aspx.pdf', FALSE, 'Portugal IAPMEI', FALSE, 82, TRUE),

    -- Trade workers
    ('trade_worker', 'Electrician — Canada Provincial Nominee Program (PNP)', 'Infrastructure Ontario', 'Canada', 'Toronto / Multiple',
     'visa_programme',
     'Canadian provinces are critically short of licensed electricians. The Ontario Immigrant Nominee Program has a dedicated trades stream. Red Seal certification is achievable after arrival. Starting salaries significantly exceed Nigeria.',
     'Licensed electrician in Nigeria (COREN or equivalent). Minimum 2 years post-qualification experience. IELTS CLB 5+. Job offer required for most streams.',
     'CAD 35–55/hour. Annual earning potential CAD 70,000–110,000', NULL, 'https://www.ontario.ca/page/oinp-employer-job-offer-in-demand-skills-stream', FALSE, 'Ontario OINP', FALSE, 79, TRUE),

    -- Freelancers
    ('freelancer', 'Deel Contractor Platform — Get Paid Globally in USD', 'Deel', 'Global', 'Remote',
     'remote_work',
     'Deel enables anyone to work remotely for companies worldwide and get paid compliantly. Set up a Deel account, get hired by international clients, receive USD payments to your Nigerian account or hold in Deel Balance.',
     'Freelance skills in tech, design, marketing, writing, or any professional service. No specific qualification required. Your skill and track record determine earnings.',
     'Client-dependent. Platform average: $2,000–$8,000/month for experienced freelancers', NULL, 'https://www.deel.com/for-contractors', FALSE, 'Deel', FALSE, 83, TRUE);
  END IF;
END $$;
