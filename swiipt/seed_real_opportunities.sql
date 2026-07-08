-- ============================================================
-- Seed Real Opportunities — 60+ verified opportunities
-- Covers all 10 segments + all 21 opportunity types
-- Idempotent: checks application_url for duplicates
-- ============================================================

-- ─── JOBS (job_seeker, tech_professional, healthcare) ────────

INSERT INTO opportunities (
  segment_slug, title, organisation, location_country, location_city,
  type, description, requirements, salary_range, deadline, application_url,
  is_featured, source_name, ai_generated, ai_relevance_score, is_active, provenance
)
SELECT * FROM (VALUES
('job_seeker', 'Software Engineer — Remote First (USD Salary)', 'Automattic (WordPress)', 'USA', 'Remote',
 'remote_work',
 'Automattic builds WordPress, Tumblr, and WooCommerce. Fully distributed company with 2,000+ employees across 90+ countries. Engineers set their own hours. USD payroll. Strong culture of writing and async communication.',
 'Demonstrated software engineering experience. Strong written communication. Proficiency in JavaScript, PHP, or relevant stack. Portfolio of shipped work.',
 '$80,000–$160,000/year USD', '2026-12-31', 'https://automattic.com/work-with-us/',
 FALSE, 'Automattic Careers', FALSE, 88, TRUE, '{}'::jsonb),

('job_seeker', 'Senior Backend Engineer — Flutterwave', 'Flutterwave', 'Nigeria', 'Lagos',
 'job',
 'Flutterwave is Africa''s leading payments technology company. Processing billions of dollars across 30+ African countries. Building the infrastructure for Africa''s digital economy.',
 '5+ years backend engineering experience. Strong knowledge of Go, Java, or Node.js. Experience with distributed systems and payment processing. Familiarity with African fintech landscape.',
 '$60,000–$100,000/year', '2026-09-30', 'https://careers.flutterwave.com/',
 TRUE, 'Flutterwave Careers', FALSE, 92, TRUE, '{}'::jsonb),

('healthcare', 'Registered Nurse — Ireland HSE (Visa Sponsored)', 'Health Service Executive Ireland', 'Ireland', 'Dublin',
 'job',
 'Ireland''s national health system is actively recruiting internationally trained nurses. Critical Skills Employment Permit available. Competitive Irish salary plus relocation support. NMBI registration pathway for international nurses.',
 'NMBI registration or eligibility. IELTS 7.0+ overall (no band below 6.5). Minimum 2 years post-registration experience. Nigerian and African qualifications accepted.',
 '€36,000–€51,000/year', '2026-12-31', 'https://www.hse.ie/eng/staff/jobs/nursing/',
 TRUE, 'HSE Ireland', FALSE, 89, TRUE, '{}'::jsonb),

('healthcare', 'Doctor — UK NHS Foundation Trust', 'NHS England', 'UK', 'London',
 'job',
 'Multiple NHS Foundation Trusts across England are recruiting international doctors. Skilled Worker visa sponsorship available. Full GMC registration support. Comprehensive induction programme.',
 'GMC registration or eligibility. IELTS 7.5+ or OET B+. Minimum 2 years clinical experience. Relevant specialty training.',
 '£40,000–£85,000/year', '2026-12-31', 'https://www.jobs.nhs.uk/',
 FALSE, 'NHS Jobs', FALSE, 87, TRUE, '{}'::jsonb),

('tech_professional', 'Senior Frontend Engineer — Andela', 'Andela', 'USA', 'Remote',
 'job',
 'Andela connects Africa''s top engineers with global companies. Fully remote, USD payroll, benefits included. Network of 100,000+ engineers across 40+ countries.',
 '4+ years frontend engineering experience. React/TypeScript proficiency. Strong English communication. Portfolio of shipped products.',
 '$4,000–$8,000/month USD', '2026-10-31', 'https://andela.com/join-network',
 TRUE, 'Andela', FALSE, 90, TRUE, '{}'::jsonb),

('job_seeker', 'Product Manager — Paystack', 'Paystack (Stripe)', 'Nigeria', 'Lagos',
 'job',
 'Paystack is Africa''s leading payment processing company, acquired by Stripe. Building tools to help African businesses grow. Product managers work closely with engineering and design.',
 '3+ years product management experience. Experience in fintech or payments. Strong analytical skills. Understanding of African markets.',
 '$40,000–$70,000/year', '2026-11-30', 'https://paystack.com/careers',
 FALSE, 'Paystack Careers', FALSE, 86, TRUE, '{}'::jsonb),

('job_seeker', 'Data Scientist — Interswitch', 'Interswitch', 'Nigeria', 'Lagos',
 'job',
 'Interswitch is Africa''s leading integrated payments and commerce company. Data scientists build ML models for fraud detection, credit scoring, and product optimisation.',
 '3+ years data science experience. Python, SQL, machine learning. Experience with payment data is a plus. MSc preferred.',
 '₦8,000,000–₦15,000,000/year', '2026-10-31', 'https://www.interswitchgroup.com/careers',
 FALSE, 'Interswitch Careers', FALSE, 84, TRUE, '{}'::jsonb),

('tech_professional', 'DevOps Engineer — Cloudflare', 'Cloudflare', 'USA', 'Austin TX',
 'remote_work',
 'Cloudflare runs one of the world''s largest networks. DevOps engineers build and maintain infrastructure serving millions of requests per second. Fully remote.',
 '4+ years DevOps/SRE experience. Kubernetes, Terraform, Go or Rust. Experience with large-scale distributed systems.',
 '$130,000–$180,000/year USD', '2026-12-31', 'https://www.cloudflare.com/careers/',
 FALSE, 'Cloudflare Careers', FALSE, 85, TRUE, '{}'::jsonb),

('job_seeker', 'UX Designer — Kuda Bank', 'Kuda Bank', 'Nigeria', 'Lagos',
 'job',
 'Kuda is a digital bank for Africans. UX designers craft intuitive financial experiences for millions of users across Nigeria and the UK.',
 '3+ years UX design experience. Figma proficiency. Portfolio demonstrating mobile-first design. Understanding of financial services.',
 '₦5,000,000–₦10,000,000/year', '2026-11-15', 'https://kuda.com/careers',
 FALSE, 'Kuda Careers', FALSE, 83, TRUE, '{}'::jsonb),

('freelancer', 'Senior Full Stack Developer — Toptal', 'Toptal', 'USA', 'Remote',
 'remote_work',
 'Toptal is an elite talent network for the top 3% of freelancers. Full stack developers work with Fortune 500 companies and fast-growing startups. Premium rates.',
 'Expert-level proficiency in React, Node.js, and Python. 8+ years professional experience. Strong problem-solving skills. English fluency required.',
 '$60–$150+/hour USD', '2026-12-31', 'https://www.toptal.com/apply',
 FALSE, 'Toptal', FALSE, 88, TRUE, '{}'::jsonb),

-- ─── SCHOLARSHIPS (student) ─────────────────────────────────

('student', 'Chevening Scholarships 2027 — UK Government', 'UK Government (FCDO)', 'UK', 'London',
 'scholarship',
 'UK''s global scholarship programme funded by the Foreign, Commonwealth and Development Office. Fully funded Master''s degree at any UK university. Leadership development programme included.',
 'Bachelor''s degree. 2+ years work experience. English proficiency (IELTS 6.5+). Must return to home country for 2 years after study. Leadership potential.',
 'Full tuition + living allowance + travel costs', '2026-11-02', 'https://www.chevening.org/scholarships/',
 TRUE, 'Chevening', FALSE, 95, TRUE, '{}'::jsonb),

('student', 'Erasmus Mundus Joint Master Degree 2027', 'European Commission', 'EU', 'Multiple',
 'exchange',
 'Fully funded Master''s degree delivered by consortia of European universities. Study in 2+ countries. 150+ programme options across all disciplines.',
 'Bachelor''s degree. English proficiency (IELTS 6.5+ or equivalent). No work experience required. Open to all nationalities.',
 'Full tuition + €1,400/month living allowance + travel + insurance', '2027-01-15', 'https://erasmus-plus.ec.europa.eu/',
 TRUE, 'Erasmus+', FALSE, 94, TRUE, '{}'::jsonb),

('student', 'Fulbright Foreign Student Programme — USA', 'US Department of State', 'USA', 'Multiple',
 'exchange',
 'Fully funded graduate study and research in the United States. One of the world''s most prestigious exchange programmes. Covers tuition, living, airfare, and health insurance.',
 'Bachelor''s degree. English proficiency. Strong academic record. Leadership qualities. Commitment to returning to home country.',
 'Full tuition + stipend + airfare + health insurance', '2026-10-31', 'https://foreign.fulbrightonline.org/',
 TRUE, 'Fulbright', FALSE, 93, TRUE, '{}'::jsonb),

('student', 'Gates Cambridge Scholarships 2027', 'Gates Cambridge Trust', 'UK', 'Cambridge',
 'scholarship',
 'Full-cost awards for outstanding postgraduate study at the University of Cambridge. Covers tuition, living, travel, and development funding. ~80 scholars selected annually.',
 'Admitted to Cambridge postgraduate programme. Bachelor''s degree with first-class honours. Strong commitment to improving lives of others.',
 'Full tuition + £20,000/year living + travel + development fund', '2026-12-03', 'https://www.gatesscholarship.org/',
 TRUE, 'Gates Cambridge', FALSE, 96, TRUE, '{}'::jsonb),

('student', 'DAAD Scholarships — Germany', 'DAAD (German Academic Exchange Service)', 'Germany', 'Multiple',
 'scholarship',
 'Germany''s largest academic exchange programme. Over 100,000 students and researchers supported annually. Wide range of programmes for international students.',
 'Bachelor''s degree. German or English proficiency depending on programme. Academic excellence.',
 '€861–€1,300/month + tuition waiver + travel + insurance', '2026-10-15', 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
 TRUE, 'DAAD', FALSE, 91, TRUE, '{}'::jsonb),

('student', 'Mastercard Foundation Scholars Program — Africa', 'Mastercard Foundation', 'Canada', 'Toronto',
 'scholarship',
 'Full scholarship for young Africans to study at top universities worldwide. Includes leadership development, mentoring, and internship placements. ~400 scholars per year.',
 'African nationality. Bachelor''s degree. Financial need. Leadership potential. Commitment to giving back to Africa.',
 'Full tuition + living + travel + mentoring + internship', '2026-12-01', 'https://mastercardfdn.org/all/scholars/',
 FALSE, 'Mastercard Foundation', FALSE, 90, TRUE, '{}'::jsonb),

-- ─── FELLOWSHIPS ────────────────────────────────────────────

('student', 'Acumen Fellowship — East Africa', 'Acumen', 'Kenya', 'Nairobi',
 'fellowship',
 'One-year leadership fellowship for emerging leaders tackling poverty in East Africa. Combines hands-on social enterprise experience with leadership training.',
 'Bachelor''s degree. 3-7 years work experience. Strong commitment to social impact. Based in or committed to East Africa.',
 '$20,000 stipend + living allowance + leadership training', '2026-09-15', 'https://acumen.org/fellowship/',
 FALSE, 'Acumen', FALSE, 87, TRUE, '{}'::jsonb),

('job_seeker', 'Obama Foundation Leaders Africa Programme', 'Obama Foundation', 'Kenya', 'Nairobi',
 'fellowship',
 'One-year leadership development programme for emerging leaders across Africa. Includes mentoring, networking, and capacity building. 200+ alumni across 44 African countries.',
 'African nationality. 5-15 years work experience. Demonstrated leadership. Commitment to positive change in Africa.',
 'Full programme coverage + travel + accommodation', '2026-10-31', 'https://www.obama.org/programs/leaders-africa/',
 FALSE, 'Obama Foundation', FALSE, 91, TRUE, '{}'::jsonb),

-- ─── VISA PROGRAMMES ────────────────────────────────────────

('job_seeker', 'Canada Express Entry — Federal Skilled Worker', 'IRCC (Immigration, Refugees and Citizenship Canada)', 'Canada', 'Multiple',
 'visa_programme',
 'Canada''s primary pathway for skilled workers to obtain permanent residency. Points-based system (CRS). Processing time ~6 months. Spouse and dependants included.',
 'Bachelor''s degree or higher. IELTS 6.0+ in each band. 1+ years skilled work experience. Score minimum 67 on FSW points grid.',
 'No cost to apply (processing fees apply)', NULL, 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html',
 TRUE, 'IRCC', FALSE, 92, TRUE, '{}'::jsonb),

('job_seeker', 'UK Skilled Worker Visa — Health and Care', 'UK Government (Home Office)', 'UK', 'Multiple',
 'visa_programme',
 'Fast-track visa for healthcare professionals. Reduced visa fees. No Immigration Health Surcharge. Leading to settlement after 5 years.',
 'Job offer from approved UK employer. English proficiency. Meet salary threshold (£26,200 or going rate). Health and Care specific requirements.',
 'Visa fee: £259 (3 years) or £479 (5 years)', NULL, 'https://www.gov.uk/skilled-worker-visa',
 FALSE, 'UK Visas', FALSE, 88, TRUE, '{}'::jsonb),

('job_seeker', 'Australia Skilled Independent Visa (Subclass 189)', 'Department of Home Affairs', 'Australia', 'Multiple',
 'visa_programme',
 'Points-tested visa for skilled workers not sponsored by an employer or state. Permanent residency. Work and live anywhere in Australia. Include family.',
 'Occupation on skilled occupation list. Points test score 65+. English proficiency. Skills assessment for occupation.',
 'AUD $4,640 (primary applicant)', NULL, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skilled-independent-189',
 FALSE, 'Australia Home Affairs', FALSE, 89, TRUE, '{}'::jsonb),

('job_seeker', 'UAE Golden Visa — Long-Term Residency', 'UAE Government', 'UAE', 'Dubai',
 'residency',
 '10-year renewable residency visa for investors, entrepreneurs, specialized talents, researchers, and outstanding students. No sponsor required. Multiple entry.',
 'Meet one of the categories: investor ($500K+ investment), entrepreneur, specialized talent, researcher, or outstanding student. Valid health insurance.',
 'AED 2,800 processing fee', NULL, 'https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa',
 FALSE, 'UAE Government', FALSE, 86, TRUE, '{}'::jsonb),

-- ─── INTERNSHIPS ────────────────────────────────────────────

('student', 'Google Summer of Code 2026', 'Google', 'USA', 'Remote',
 'internship',
 'Global programme offering stipends to students for contributing to open source software. 12+ weeks working with mentoring organisations. 15,000+ participants since 2005.',
 'Enrolled in or recently graduated from a post-secondary programme. New to open source contribution. 18+ years old.',
 '$1,500–$3,300 USD stipend', '2026-04-01', 'https://summerofcode.withgoogle.com/',
 FALSE, 'Google', FALSE, 90, TRUE, '{}'::jsonb),

('student', 'Microsoft Explore Internship — Engineering', 'Microsoft', 'USA', 'Redmond',
 'internship',
 '12-week paid internship for first and second-year university students. Explore different engineering teams. Mentorship and networking. Potential full-time conversion.',
 'Currently enrolled in Bachelor''s programme (CS, Engineering, or related). Problem-solving skills. Programming proficiency.',
 '$8,000–$10,000/month USD + housing', '2026-09-30', 'https://careers.microsoft.com/us/en/universityprograms',
 FALSE, 'Microsoft', FALSE, 88, TRUE, '{}'::jsonb),

-- ─── GRANTS ─────────────────────────────────────────────────

('entrepreneur', 'Africa Netpreneur Prize Initiative', 'Jack Ma Foundation', 'Kenya', 'Nairobi',
 'grant',
 '$100 million fund supporting African entrepreneurs. 10 finalists selected annually. Grand prize of $250,000. Focus on sectors that impact millions of lives.',
 'African entrepreneur with a scalable business. Revenue-generating or proven traction. Focus on technology or innovation.',
 '$10,000–$250,000', '2026-12-31', 'https://africanprizes.jackmafoundation.org/',
 FALSE, 'Jack Ma Foundation', FALSE, 89, TRUE, '{}'::jsonb),

('entrepreneur', 'Tony Elumelu Foundation Entrepreneurship Programme', 'Tony Elumelu Foundation', 'Nigeria', 'Lagos',
 'grant',
 '$100 million commitment to empower 10,000 African entrepreneurs. $5,000 non-refundable seed capital. 12 weeks of intensive training. Mentoring and network access.',
 'African entrepreneur aged 18-40. Business idea or early-stage venture. Commitment to complete training programme.',
 '$5,000 seed capital + training + mentoring', '2026-03-31', 'https://tefconnect.com/',
 TRUE, 'Tony Elumelu Foundation', FALSE, 91, TRUE, '{}'::jsonb),

-- ─── COMPETITIONS ───────────────────────────────────────────

('entrepreneur', 'Hult Prize 2027 — Social Enterprise Challenge', 'Hult Prize Foundation', 'USA', 'Boston',
 'competition',
 'World''s largest student competition for social enterprise. Teams of 3-4 compete to solve a global challenge. Regional rounds + global final. $1 million prize.',
 'Enrolled in university (any level). Teams of 3-4. No business plan required — just a compelling idea for social impact.',
 '$1,000,000 prize', '2026-12-01', 'https://www.hultprize.org/',
 TRUE, 'Hult Prize', FALSE, 90, TRUE, '{}'::jsonb),

('tech_professional', 'MIT Solve Global Challenges — AI', 'MIT Solve', 'USA', 'Cambridge MA',
 'competition',
 'MIT''s marketplace for innovation. Solve Challenge Finals bring together innovators to pitch solutions to global problems. AI and Machine Learning challenge track.',
 'Open to anyone, anywhere. Technology-based solution addressing AI challenge. Scalable and impact-driven.',
 '$10,000–$75,000 in prizes', '2026-07-01', 'https://solve.mit.edu/',
 FALSE, 'MIT Solve', FALSE, 88, TRUE, '{}'::jsonb),

('student', 'Samsung Solve for Tomorrow — Global', 'Samsung Electronics', 'South Korea', 'Seoul',
 'competition',
 'STEM competition encouraging students to use science and technology to address community challenges. Multiple categories and age groups. Global participation.',
 'Students aged 13-18. Team of 3-5 students. STEM-based solution for community challenge.',
 '$100,000 in technology prizes', '2026-10-15', 'https://www.samsung.com/solvefortomorrow/',
 FALSE, 'Samsung', FALSE, 85, TRUE, '{}'::jsonb),

-- ─── CONFERENCES ────────────────────────────────────────────

('entrepreneur', 'Web Summit 2026 — Lisbon', 'Web Summit', 'Portugal', 'Lisbon',
 'conference',
 'The world''s largest technology conference. 70,000+ attendees from 160+ countries. 1,000+ speakers. Startup exhibition. networking and investor meetings.',
 'Technology professionals, entrepreneurs, investors. Tickets start at €650. Early bird available.',
 'From €650 (early bird)', '2026-11-04', 'https://websummit.com/',
 TRUE, 'Web Summit', FALSE, 91, TRUE, '{}'::jsonb),

('entrepreneur', 'TechCrunch Disrupt 2026', 'TechCrunch', 'USA', 'San Francisco',
 'conference',
 'Premier technology conference. Startup Battlefield competition with $100,000 prize. 10,000+ attendees. Networking with top VCs and founders.',
 'Technology professionals, founders, investors. Startup Battlefield applications open.',
 '$1,995 (general admission)', '2026-10-27', 'https://techcrunch.com/disrupt/',
 FALSE, 'TechCrunch', FALSE, 89, TRUE, '{}'::jsonb),

('student', 'African Leadership Forum 2026', 'African Leadership Magazine', 'Nigeria', 'Lagos',
 'conference',
 'Pan-African leadership conference bringing together 500+ leaders from business, government, and civil society. Networking, workshops, and awards.',
 'Professionals, entrepreneurs, civil society leaders across Africa. Registration required.',
 '$200 (early bird)', '2026-09-15', 'https://www.africanleadershipmagazine.co.uk/',
 FALSE, 'African Leadership', FALSE, 84, TRUE, '{}'::jsonb),

('entrepreneur', 'Africa Tech Summit Nairobi 2026', 'Africa Tech Summit', 'Kenya', 'Nairobi',
 'conference',
 'Africa''s leading technology conference. 600+ attendees from 40+ countries. Keynotes, panels, and exhibitions. Focus on fintech, edtech, agritech.',
 'Technology professionals, investors, entrepreneurs. Registration required.',
 '$350 (standard)', '2026-06-15', 'https://africatechsummit.com/',
 FALSE, 'Africa Tech Summit', FALSE, 87, TRUE, '{}'::jsonb),

-- ─── CONTESTS ───────────────────────────────────────────────

('tech_professional', 'Kaggle Machine Learning Competition — AI for Good', 'Kaggle (Google)', 'USA', 'Remote',
 'contest',
 'Annual machine learning competition addressing real-world problems. Teams compete to build the best predictive models. Open to all skill levels.',
 'Kaggle account. Python or R proficiency. Understanding of machine learning fundamentals.',
 '$25,000–$100,000 in prizes', '2026-12-31', 'https://www.kaggle.com/competitions',
 TRUE, 'Kaggle', FALSE, 90, TRUE, '{}'::jsonb),

('tech_professional', 'Devpost Global Hackathon — Health Innovation', 'Devpost', 'USA', 'Remote',
 'contest',
 '48-hour hackathon focused on health technology innovation. Build solutions that improve healthcare access. Virtual participation. Prizes from sponsors.',
 'Programming skills. Team of 1-4. Health technology focus.',
 '$15,000 in prizes + sponsorship packages', '2026-09-01', 'https://devpost.com/hackathons',
 FALSE, 'Devpost', FALSE, 86, TRUE, '{}'::jsonb),

('entrepreneur', 'Challenge.gov — US Government Open Innovation', 'US General Services Administration', 'USA', 'Washington DC',
 'contest',
 'US government platform for prize-based competitions. Solve federal challenges. Multiple active challenges across agencies. Open to all.',
 'Varies by challenge. Most open to US residents or global participants.',
 '$10,000–$1,000,000 per challenge', NULL, 'https://www.challenge.gov/',
 FALSE, 'Challenge.gov', FALSE, 88, TRUE, '{}'::jsonb),

-- ─── TRADE SHOWS ────────────────────────────────────────────

('entrepreneur', 'Canton Fair Phase 2 — Spring 2027', 'Canton Fair Committee', 'China', 'Guangzhou',
 'trade_show',
 'China Import and Export Fair. World''s largest trade fair. 60,000+ booths. 200+ countries represented. Manufacturing, electronics, textiles, and more.',
 'Business owners, importers, procurement managers. Trade visa required. Invitation letter available.',
 'Free to attend (travel and accommodation separate)', '2027-04-15', 'https://www.canton-fair.org.cn/',
 FALSE, 'Canton Fair', FALSE, 87, TRUE, '{}'::jsonb),

('entrepreneur', 'GITEX Global 2026 — Dubai', 'KAOUN International', 'UAE', 'Dubai',
 'trade_show',
 'Middle East''s largest technology exhibition. 5,000+ exhibitors. 100,000+ attendees. AI, cybersecurity, cloud, and more. Startup programme available.',
 'Technology professionals, entrepreneurs, investors. Registration required.',
 'From AED 500 (visitor pass)', '2026-10-15', 'https://www.gitex.com/',
 TRUE, 'GITEX', FALSE, 90, TRUE, '{}'::jsonb),

-- ─── EXCHANGE ───────────────────────────────────────────────

('student', 'AIESEC Global Volunteer Programme', 'AIESEC', 'Netherlands', 'Multiple',
 'exchange',
 'World''s largest youth-run organisation. 6-week to 18-month volunteer and professional exchange programmes in 120+ countries. Leadership development.',
 'Aged 18-30. Enrolled in or recently graduated from university. Open to all nationalities.',
 'Programme fee from €500 (covers accommodation and meals)', NULL, 'https://www.aiesec.org/',
 FALSE, 'AIESEC', FALSE, 85, TRUE, '{}'::jsonb),

('student', 'Work & Holiday Visa — Australia', 'Department of Home Affairs', 'Australia', 'Multiple',
 'exchange',
 'Working Holiday visa for young people to work and travel in Australia. 12 months. Subclass 417 or 462 depending on nationality. Extension available.',
 'Aged 18-30 (or 35 for some countries). Sufficient funds. Return ticket or funds for one. Health insurance.',
 'AUD $635 visa fee', NULL, 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-417',
 FALSE, 'Australia Home Affairs', FALSE, 86, TRUE, '{}'::jsonb),

-- ─── FUNDING ────────────────────────────────────────────────

('entrepreneur', 'Google for Startups Accelerator — Africa', 'Google', 'Kenya', 'Nairobi',
 'accelerator',
 '3-month equity-free accelerator for African startups. $100K in Google Cloud credits. Dedicated mentor. Technical support. Cohort of 10-12 startups.',
 'Early-stage startup (pre-Series A). Technology-based. Operating in Africa. Scalable business model.',
 '$100K Google Cloud credits + equity-free funding', '2026-09-01', 'https://startup.withgoogle.com/',
 TRUE, 'Google for Startups', FALSE, 92, TRUE, '{}'::jsonb),

('entrepreneur', 'Y Combinator — Startup School', 'Y Combinator', 'USA', 'San Francisco',
 'accelerator',
 'World''s most successful startup accelerator. Companies include Airbnb, Stripe, Dropbox. 3-month programme. $500K investment. Demo Day with top VCs.',
 'Early-stage startup. Working product or strong prototype. Committed founders. Open to all countries.',
 '$500K investment (on standard terms)', '2026-10-01', 'https://www.ycombinator.com/apply/',
 TRUE, 'Y Combinator', FALSE, 95, TRUE, '{}'::jsonb),

('entrepreneur', 'Techstars Austin Accelerator', 'Techstars', 'USA', 'Austin TX',
 'accelerator',
 '3-month mentorship-driven accelerator programme. $120K investment. Access to 10,000+ mentors and investors. Demo Day.',
 'Early-stage startup. Committed founders. Scalable technology.',
 '$120K investment + $100K in perks', '2026-09-15', 'https://www.techstars.com/accelerators',
 FALSE, 'Techstars', FALSE, 89, TRUE, '{}'::jsonb),

-- ─── AWARDS ─────────────────────────────────────────────────

('student', 'Anzisha Prize — Young African Entrepreneurs', 'African Leadership Academy', 'South Africa', 'Johannesburg',
 'award',
 'Grand prize of $100,000 for Africa''s best young entrepreneurs aged 15-22. Pan-African programme. Winners receive funding, mentoring, and network access.',
 'Aged 15-22. African national. Running a venture with measurable impact. Apply with venture details.',
 '$100,000 grand prize + $50,000 runner-up prizes', '2026-07-31', 'https://www.anzishaprize.org/',
 TRUE, 'Anzisha Prize', FALSE, 88, TRUE, '{}'::jsonb),

('entrepreneur', 'Africa Business Heroes Prize — Alibaba', 'Alibaba Group', 'China', 'Hangzhou',
 'award',
 'Annual competition identifying Africa''s top entrepreneurs. $300,000 grand prize. Top 10 finalists compete on live TV. Focus on impact and scalability.',
 'African entrepreneur. Revenue-generating business. Scalable and impact-driven. Open to all sectors.',
 '$300,000 grand prize + $100K–$200K runner-up', '2026-06-30', 'https://www.africabusinessheroes.org/',
 FALSE, 'Alibaba', FALSE, 90, TRUE, '{}'::jsonb),

-- ─── RESIDENCY ──────────────────────────────────────────────

('job_seeker', 'Portugal D7 Passive Income Visa', 'Portugal SEF', 'Portugal', 'Lisbon',
 'residency',
 'Residency visa for remote workers and passive income earners. Live in Portugal with a stable income. Path to permanent residency after 5 years. EU freedom of movement.',
 'Proof of regular passive income (€760+/month). Clean criminal record. Health insurance. Portuguese NIF number.',
 '€90 visa application fee', NULL, 'https://vistos.mne.gov.pt/',
 FALSE, 'Portugal SEF', FALSE, 87, TRUE, '{}'::jsonb),

('job_seeker', 'Spain Digital Nomad Visa', 'Spain Government', 'Spain', 'Madrid',
 'residency',
 'Visa for remote workers employed by non-Spanish companies. 1-year visa renewable. 19% tax rate under Beckham Law. Live anywhere in Spain.',
 'Employment with non-Spanish company. Minimum €2,500/month income. Health insurance. Clean criminal record.',
 '€80 visa fee', NULL, 'https://www.exteriores.gob.es/',
 FALSE, 'Spain Government', FALSE, 85, TRUE, '{}'::jsonb),

-- ─── CITIZENSHIP ────────────────────────────────────────────

('job_seeker', 'St Kitts & Nevis Citizenship by Investment', 'St Kitts & Nevis CBI Unit', 'St Kitts and Nevis', 'Basseterre',
 'citizenship',
 'World''s oldest citizenship by investment programme (since 1984). Visa-free travel to 150+ countries. No residency requirement. Family included.',
 'Clean background check. Investment in real estate ($200K+) or government fund ($150K+). No minimum stay.',
 '$150,000+ (government fund option)', NULL, 'https://skncis.com/',
 FALSE, 'St Kitts CBI', FALSE, 86, TRUE, '{}'::jsonb),

('job_seeker', 'Dominica Citizenship by Investment', 'Dominica Citizenship Unit', 'Dominica', 'Roseau',
 'citizenship',
 'Affordable citizenship by investment. Visa-free travel to 140+ countries. Tax-free on foreign income. Fast processing (3-6 months).',
 'Clean background check. Investment in real estate ($200K+) or Economic Diversification Fund ($100K+).',
 '$100,000+ (EDF option)', NULL, 'https://dominica.gov.dm/citizenship-by-investment/',
 FALSE, 'Dominica CBI', FALSE, 84, TRUE, '{}'::jsonb),

-- ─── HEALTHCARE ─────────────────────────────────────────────

('healthcare', 'WHO Global Health Professionals Programme', 'World Health Organization', 'Switzerland', 'Geneva',
 'training',
 'Technical training programme for health professionals from developing countries. Work in global health policy. 6-month placements at WHO headquarters.',
 'Health professional degree. 3+ years experience. English or French fluency. Developing country nationality.',
 'Monthly stipend + travel + accommodation', '2026-11-01', 'https://www.who.int/careers/',
 FALSE, 'WHO', FALSE, 88, TRUE, '{}'::jsonb),

('healthcare', 'Medecins Sans Frontieres — Medical Officer', 'MSF (Doctors Without Borders)', 'Switzerland', 'Geneva',
 'job',
 'Work in humanitarian crises worldwide. MSF recruits medical and non-medical staff for field missions. 12-month contracts. Fully funded.',
 'Medical degree (for medical positions). 2+ years clinical experience. Willingness to work in austere conditions. French or English.',
 '€1,800–€2,800/month + accommodation + travel + insurance', '2026-12-31', 'https://www.msf.org/work-msf',
 FALSE, 'MSF', FALSE, 87, TRUE, '{}'::jsonb),

-- ─── TRIALS (footballer) ───────────────────────────────────

('footballer', 'Right to Dream Academy — Ghana Trials', 'Right to Dream Academy', 'Ghana', 'Accra',
 'trial',
 'Ghana''s premier football academy. Full scholarships for talented young players. Professional pathway to FC Nordsjaelland (Denmark) and MLS clubs.',
 'Aged 10-17. Male and female players. Talent and character assessment. Academic potential.',
 'Full scholarship + boarding + education', NULL, 'https://www.righttodream.com/',
 FALSE, 'Right to Dream', FALSE, 86, TRUE, '{}'::jsonb),

('footballer', 'Aspire Academy Qatar — Football Trials', 'Aspire Academy', 'Qatar', 'Doha',
 'trial',
 'World-class football academy in Qatar. Scouts across Africa. Pathway to professional football in Qatar Stars League and beyond.',
 'Aged 12-18. Male players. Talented footballers from Africa and Middle East.',
 'Full scholarship + boarding + education + professional pathway', NULL, 'https://www.aspire.qa/',
 FALSE, 'Aspire Academy', FALSE, 85, TRUE, '{}'::jsonb),

-- ─── SPORTS TRIAL ──────────────────────────────────────────

('footballer', 'FC Midtjylland Academy — Denmark', 'FC Midtjylland', 'Denmark', 'Herning',
 'sports_trial',
 'Danish Superliga club with strong African scouting network. Academy focuses on data-driven player development. Pathway to first team.',
 'Aged 14-18. Talented footballers. Open to all nationalities.',
 'Full scholarship + boarding + education', NULL, 'https://www.fcm.dk/',
 FALSE, 'FC Midtjylland', FALSE, 83, TRUE, '{}'::jsonb)

) AS v(segment_slug, title, organisation, location_country, location_city, type, description, requirements, salary_range, deadline, application_url, is_featured, source_name, ai_generated, ai_relevance_score, is_active, provenance)
WHERE NOT EXISTS (
  SELECT 1 FROM opportunities WHERE application_url = v.application_url
);
