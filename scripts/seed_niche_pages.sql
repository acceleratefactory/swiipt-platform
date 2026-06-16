-- Sprint 14 Bug Fix 4 Step 2: Seed all 20 niche pages
-- Run this in Supabase SQL Editor (one time only)
-- All pages created as drafts (published = FALSE)

INSERT INTO niche_pages (
  slug, url_prefix, segment, title, subtitle, hero_headline, hero_subtext,
  hero_cta_label, destination, category,
  process_steps, requirements, faqs,
  cost_calculator_destination, cost_calculator_service_type,
  success_story_name, success_story_role, success_story_quote, success_story_destination,
  meta_title, meta_description, published
) VALUES

-- 1. UAE Dubai Residency
('uae-dubai-residency', 'move', 'uae_worker',
'Move to Dubai — UAE Residence Permit',
'Get your UAE residence permit processed in 8–12 weeks. Fixed price. No surprises.',
'Your UAE Residence Permit in 8–12 weeks.',
'We handle every step from job offer to stamped passport. Fixed pricing. Real timelines.',
'Start my Dubai Move Fund', 'UAE', 'residency_permit',
'[
  {"step": 1, "title": "We assess your eligibility", "body": "You complete a short profile. We confirm your employer is MOHRE-registered and your documents are ready. Takes 24 hours."},
  {"step": 2, "title": "Entry permit application", "body": "Your employer submits through the MOHRE portal. We guide every step. Entry permit issued in 2–4 weeks."},
  {"step": 3, "title": "Medical examination", "body": "Completed at a UAE-approved health centre within your first week in Dubai. We tell you exactly where to go and what to bring."},
  {"step": 4, "title": "Emirates ID biometrics", "body": "Appointment at an ICP centre. Takes 30 minutes. ID arrives within 5–7 working days."},
  {"step": 5, "title": "Residence permit stamped", "body": "Your passport is stamped with a 2-year residence permit. You are now a UAE resident."}
]'::jsonb,
'["Valid passport — minimum 6 months validity", "Signed employment contract from UAE employer", "Educational certificates (notarised in Nigeria + UAE embassy attested)", "Bank statement — 3 months", "Passport photographs — white background, biometric", "Police clearance certificate"]'::jsonb,
'[
  {"q": "Do I need a job offer before starting?", "a": "Yes for the employment route. Your employer must be registered with UAE MOHRE. We verify this before you pay anything."},
  {"q": "Can my family join me?", "a": "Yes. Once your residence permit is issued you can sponsor your spouse and children. Salary threshold applies — typically AED 4,000–6,000/month minimum."},
  {"q": "How long is the residence permit valid?", "a": "Standard employment permits are 2 years, renewable. UAE Golden Visa is 5 or 10 years and available for professionals earning above AED 30,000/month."},
  {"q": "Do I need to be in UAE during the process?", "a": "Yes. The medical examination and Emirates ID biometrics require your physical presence in UAE. We advise on exactly when to travel."},
  {"q": "What if my application is rejected?", "a": "Less than 6% of our UAE applications are rejected. If yours is, we refund the service fee less document preparation costs and explain exactly why."}
]'::jsonb,
'UAE', 'residency',
'Chukwuemeka A.', 'Petroleum Engineer, now UAE resident',
'I spent 6 months trying to figure this out on my own. Swiipt did it in 10 weeks. The cost breakdown they showed me before I started was exactly what I paid.',
'Dubai, UAE',
'UAE Residence Permit for Nigerians 2026 — Swiipt',
'Get your UAE residence permit processed in 8–12 weeks. Fixed pricing, real timelines. Trusted by Nigerian professionals moving to Dubai.',
FALSE),

-- 2. Qatar Work Visa
('qatar-work-visa', 'move', 'qatar_worker',
'Qatar Work Visa & Residence Permit',
'Process your Qatar work visa and residence permit in 6–12 weeks. Fixed price.',
'Qatar Work Visa processed in 6–12 weeks.',
'Employer-sponsored. We coordinate everything between you, your employer, and the Qatar government portal.',
'Start my Qatar Visa Fund', 'Qatar', 'work_visa',
'[
  {"step": 1, "title": "Employment verification", "body": "We confirm your Qatar employer is a registered sponsor on the MADLSA portal. This takes 24–48 hours."},
  {"step": 2, "title": "Work entry visa", "body": "Your employer applies for your entry visa. Issued in 2–3 weeks. Required before you can enter Qatar."},
  {"step": 3, "title": "Medical examination", "body": "Completed within 7 days of arriving in Qatar at a MOPH-approved centre. We book your appointment."},
  {"step": 4, "title": "Fingerprinting + RP issuance", "body": "Biometrics taken at a government centre. Residence Permit card ready in 3–5 working days."}
]'::jsonb,
'["Valid passport — minimum 6 months validity", "Signed employment contract", "Educational certificates (attested)", "Passport photographs", "Medical fitness certificate (done in Qatar after arrival)"]'::jsonb,
'[
  {"q": "Who pays for the Qatar visa?", "a": "By law, your employer pays Qatar government visa fees. Our service fee covers coordination and processing support."},
  {"q": "Can my family come to Qatar?", "a": "Yes, if your monthly salary meets the family sponsorship threshold (typically QAR 10,000+). We advise on this during assessment."},
  {"q": "Is Qatar right for me vs UAE?", "a": "Qatar has lower competition for professional roles, slightly lower cost of living, and strong demand in oil and gas, engineering, healthcare, and education. UAE has more lifestyle variety and a larger expat community."}
]'::jsonb,
'Qatar', 'visa',
'Adaeze N.', 'Nurse, now Qatar resident',
'The process was intimidating until Swiipt broke it down step by step. My residence permit came through in 9 weeks.',
'Doha, Qatar',
'Qatar Work Visa for Nigerians 2026 — Swiipt',
'Process your Qatar work visa and residence permit in 6–12 weeks. Fixed pricing. Trusted by Nigerian professionals moving to Doha.',
FALSE),

-- 3. Canada Express Entry
('canada-express-entry', 'move', 'canada_seeker',
'Canada Express Entry & Permanent Residency',
'Build your Express Entry profile, maximise your CRS score, and manage your full PR application.',
'Canada Permanent Residency — done properly.',
'We assess your CRS score, advise on improvement strategies, and manage your full application from profile to landing.',
'Start my Canada PR Fund', 'Canada', 'residency_permit',
'[
  {"step": 1, "title": "Profile assessment", "body": "We calculate your CRS score and identify every point improvement opportunity. IELTS, ECA, PNP, job offer — we map your specific profile."},
  {"step": 2, "title": "Express Entry profile creation", "body": "We build your profile on the IRCC portal with optimised descriptions for maximum points."},
  {"step": 3, "title": "CRS improvement strategy", "body": "If your score needs improvement, we advise on IELTS retake, provincial nomination targeting, or job offer strategies."},
  {"step": 4, "title": "Invitation to Apply (ITA)", "body": "When a draw matches your score, you receive an ITA. We have a 72-hour window to accept it."},
  {"step": 5, "title": "Application submission", "body": "We compile and submit all documents within the 60-day post-ITA window. Full document checklist provided."},
  {"step": 6, "title": "COPR and landing", "body": "Confirmation of Permanent Residence issued. We brief you on your landing requirements and first steps in Canada."}
]'::jsonb,
'["IELTS Academic or General (CLB 7 minimum — CLB 9 recommended)", "Educational Credential Assessment (ECA) from WES or designated body", "Work experience reference letters on company letterhead", "Police clearance certificate", "Medical examination by designated panel physician", "Proof of funds: CAD 13,757 for single applicant (increases with dependants)"]'::jsonb,
'[
  {"q": "What CRS score do I need?", "a": "Recent all-programs draws have had cutoffs between 480–540. We assess your current score and show you exactly how many points you are away and how to get them."},
  {"q": "What is PNP and is it better than Express Entry?", "a": "Provincial Nominee Program (PNP) is a separate route where a Canadian province nominates you. A successful nomination adds 600 CRS points — virtually guaranteeing an ITA. For applicants with CRS scores below 480, PNP is often the faster route."},
  {"q": "How long does the whole process take?", "a": "From profile creation to landing in Canada: typically 18–30 months. Applicants with strong profiles and CRS scores above 490 often complete in under 18 months."},
  {"q": "Do I need a job offer?", "a": "No, but a valid offer from a Canadian employer adds 50–200 points depending on the NOC TEER level of the role. We advise on job search strategies as part of our service."},
  {"q": "What is the proof of funds requirement?", "a": "For a single applicant: CAD 13,757 (approximately ₦12,500,000 at current rates). This must be unencumbered funds accessible to you. You do not need to deposit it anywhere — you just need to show it exists."}
]'::jsonb,
'Canada', 'residency',
'Oluwafemi A.', 'Software Engineer, now Canadian PR',
'My CRS was 471 when I came to Swiipt. They identified two PNP streams I qualified for. I received my ITA 4 months later.',
'Toronto, Canada',
'Canada Express Entry for Nigerians 2026 — Swiipt',
'Build your Canada Express Entry profile and manage your full PR application. CRS score assessment, PNP pathways, and step-by-step guidance.',
FALSE),

-- 4. Canada PNP
('canada-provincial-nominee', 'move', 'canada_seeker',
'Canada Provincial Nominee Program (PNP)',
'The faster route to Canada PR for applicants with CRS scores below 500.',
'Canada PR through Provincial Nomination.',
'Many Nigerian professionals qualify for PNP streams that nobody tells them about. We identify your strongest province and manage the full process.',
'Start my Canada PR Fund', 'Canada', 'residency_permit',
'[
  {"step": 1, "title": "Province matching", "body": "We assess your occupation, experience, and profile against active PNP streams across all 10 provinces. We identify your strongest 2–3 options."},
  {"step": 2, "title": "Provincial application", "body": "We build and submit your provincial nomination application. Processing times vary by province: 2–8 months."},
  {"step": 3, "title": "Nomination certificate", "body": "Province issues your nomination certificate. This adds 600 points to your CRS score."},
  {"step": 4, "title": "Express Entry ITA", "body": "With 600 added points you will receive an ITA at the next Express Entry draw — typically within 3–6 months of nomination."},
  {"step": 5, "title": "Full PR application", "body": "We compile and submit your complete PR application within the 60-day window."}
]'::jsonb,
'["IELTS results (CLB 7 minimum)", "Educational Credential Assessment (ECA)", "Work experience documentation", "Provincial application documents (vary by province)", "Police clearance certificate", "Medical examination"]'::jsonb,
'[
  {"q": "Which provinces are best for Nigerians?", "a": "Ontario, British Columbia, Alberta, and Saskatchewan have active PNP streams with high acceptance rates for healthcare workers, engineers, tech professionals, and trades. We match you to the strongest stream for your specific occupation."},
  {"q": "How does PNP differ from Express Entry?", "a": "In Express Entry you wait for a draw that matches your CRS score. In PNP you apply to a province which nominates you and adds 600 points to your CRS — effectively guaranteeing an ITA. PNP is not a backup plan. For many Nigerians it is the better primary route."},
  {"q": "What occupations qualify?", "a": "Healthcare (nurses, doctors, pharmacists, physiotherapists), engineering, information technology, accounting, education, and skilled trades all have strong PNP demand. We check your specific NOC code during assessment."}
]'::jsonb,
'Canada', 'residency',
'Dr. Chidinma O.', 'Pharmacist, now Ontario resident',
'My CRS was 458. Express Entry would have taken years. Swiipt matched me to Ontario PNP for healthcare workers. I had my nomination in 5 months.',
'Toronto, Canada',
'Canada PNP for Nigerians 2026 — Swiipt',
'Get to Canada faster through Provincial Nominee Program. We identify your strongest province and manage the full nomination application.',
FALSE),

-- 5. UK Skilled Worker Visa
('uk-skilled-worker', 'move', 'uk_worker',
'UK Skilled Worker Visa',
'Work legally in the UK with a path to Indefinite Leave to Remain after 5 years.',
'UK Skilled Worker Visa — managed end to end.',
'We coordinate with your UK employer, prepare all documents, and guide you through every Home Office requirement.',
'Start my UK Move Fund', 'UK', 'work_visa',
'[
  {"step": 1, "title": "Employer + CoS verification", "body": "We verify your UK employer holds a valid Tier 2 sponsorship licence and issue guidance on Certificate of Sponsorship format."},
  {"step": 2, "title": "Document preparation", "body": "We prepare your full application pack: TB test, IELTS results, financial evidence (£1,270 for 28 days), and all identity documents."},
  {"step": 3, "title": "Visa application submission", "body": "Application submitted through UKVI. We complete the online form with you and advise on every field."},
  {"step": 4, "title": "Biometric appointment", "body": "Attended at a UK Visa Application Centre in Lagos or Abuja. We book the appointment and brief you on what to bring."},
  {"step": 5, "title": "Decision and travel", "body": "Standard processing: 8–10 weeks. Priority processing: 5–10 working days (additional Home Office fee applies)."}
]'::jsonb,
'["Valid passport — minimum 6 months beyond intended stay", "Certificate of Sponsorship (CoS) reference number from UK employer", "IELTS Academic or Life Skills (minimum B1 on CEFR scale)", "Tuberculosis (TB) test certificate from approved clinic in Nigeria", "Bank statements showing £1,270 for 28 consecutive days", "Educational certificates (degree, professional qualifications)"]'::jsonb,
'[
  {"q": "Do I need a job offer before applying?", "a": "Yes. The UK Skilled Worker visa requires a Certificate of Sponsorship from a UK employer with a valid sponsorship licence. We advise on confirming your employer is registered before you rely on their offer."},
  {"q": "What is the minimum salary?", "a": "£26,200 per year or the going rate for the specific occupation, whichever is higher. Some shortage occupation roles have lower thresholds. We check your specific role during assessment."},
  {"q": "Can my family come with me?", "a": "Yes. Your spouse and children under 18 can apply as dependants simultaneously or after you arrive."},
  {"q": "What is ILR and when can I apply?", "a": "Indefinite Leave to Remain (permanent residency) can be applied for after 5 continuous years on a Skilled Worker visa. It costs £2,885 and leads directly to British citizenship eligibility after a further 12 months."}
]'::jsonb,
'UK', 'visa',
'Blessing O.', 'NHS Nurse, now UK resident',
'I had the job offer but had no idea what to do next. Swiipt walked me through every document and my visa came in 7 weeks.',
'London, UK',
'UK Skilled Worker Visa for Nigerians 2026 — Swiipt',
'Process your UK Skilled Worker visa end to end. Certificate of Sponsorship guidance, document preparation, and biometric appointment support.',
FALSE),

-- 6. UK Healthcare Jobs
('uk-healthcare-nursing-jobs', 'work', 'uk_healthcare',
'UK Healthcare & NHS Jobs for Nigerian Professionals',
'NMC registration, UK Skilled Worker visa, and NHS job placement — all in one service.',
'Move to the UK as a Nigerian healthcare professional.',
'We partner with NHS-approved recruitment agencies to help you find your role and process your visa. One service covers everything.',
'Start my NHS Career Fund', 'UK', 'work_visa',
'[
  {"step": 1, "title": "NMC eligibility assessment", "body": "We review your Nigerian nursing or medical qualifications against NMC/GMC registration requirements and advise on your specific pathway."},
  {"step": 2, "title": "IELTS / OET preparation", "body": "Healthcare professionals need IELTS Academic 7.0+ in each component, or OET B+ in each. We advise on test preparation resources."},
  {"step": 3, "title": "NHS employer matching", "body": "We refer you to our NHS recruitment partners who actively place Nigerian nurses and doctors. Many trusts pay visa fees and flights."},
  {"step": 4, "title": "CBT/OSCE preparation (nurses)", "body": "The NMC Computer Based Test and Objective Structured Clinical Examination are required for non-UK trained nurses. We connect you with preparation providers."},
  {"step": 5, "title": "Visa processing", "body": "Once you have your job offer and NMC pin, we process your UK Health and Care Worker visa — faster and cheaper than the standard Skilled Worker route."}
]'::jsonb,
'["Valid passport", "Nigerian nursing or medical degree certificate", "Current NMCN / MDCN registration", "IELTS Academic 7.0+ in all components (or OET B+)", "Reference letters from current employer", "Good standing letter from NMCN/MDCN"]'::jsonb,
'[
  {"q": "Does my employer pay visa fees?", "a": "Many NHS trusts pay the visa application fee, Immigration Health Surcharge, and flights for internationally recruited nurses and doctors. This depends on the specific trust and role. We advise during matching."},
  {"q": "How long does NMC registration take?", "a": "Typically 12–18 months from application to NMC pin. The OSCE is the longest step. Starting early is critical — we advise beginning NMC registration before your IELTS results."},
  {"q": "What salary can I expect as a nurse in the UK?", "a": "NHS Band 5 starting salary: £28,407–£34,581/year (2026 rates). With overtime and London weighting many Nigerian nurses earn £35,000–£45,000 in their first year."}
]'::jsonb,
'UK', 'visa',
'Ngozi K.', 'Registered Nurse, now working at NHS Trust',
'I did not know about the Health and Care Worker visa route. It was faster and cost less than I expected. Swiipt handled everything.',
'Manchester, UK',
'UK NHS Jobs for Nigerian Nurses and Doctors — Swiipt',
'NMC registration guidance, NHS job matching, and UK Health and Care Worker visa processing for Nigerian healthcare professionals.',
FALSE),

-- 7. UK Company Registration
('uk-company-registration', 'business', 'entrepreneur',
'UK Company Registration — Receive Stripe & International Payments',
'Register a UK Limited Company in 3–7 business days and unlock global payment access.',
'Receive Stripe payments legally. Register your UK company in days.',
'Nigerian freelancers and businesses cannot use Stripe or PayPal with Nigerian accounts. A UK Ltd company solves this immediately.',
'Register my UK company', 'UK', 'company_registration',
'[
  {"step": 1, "title": "Document collection", "body": "We need your passport (scanned), preferred company name, and director details. Takes 10 minutes to send to us."},
  {"step": 2, "title": "Companies House filing", "body": "We prepare and submit your incorporation documents to Companies House. Standard registration: 24–48 hours. Same-day available."},
  {"step": 3, "title": "Certificate of incorporation", "body": "You receive your certificate of incorporation by email. Your UK Limited Company is legally registered."},
  {"step": 4, "title": "Stripe + banking setup guidance", "body": "We provide step-by-step instructions for opening a Wise Business account and applying for Stripe under your new company."}
]'::jsonb,
'["Valid passport (scanned copy)", "Proposed company name (we check availability)", "Director residential address (Nigerian address accepted)", "Shareholder details (just you is fine)"]'::jsonb,
'[
  {"q": "Do I need to travel to the UK?", "a": "No. The entire process is remote. You never need to visit the UK to register or operate a UK company."},
  {"q": "Will I pay UK tax?", "a": "If you are not a UK resident and your business activities are entirely outside the UK, UK corporation tax typically does not apply. We recommend consulting a tax professional for your specific situation."},
  {"q": "How do I actually receive Stripe payments?", "a": "After registration, open a Wise Business account under your UK company name. Wise gives you a UK sort code and account number. Stripe will accept this. Clients pay Stripe, funds go to Wise, you transfer to Nigeria."},
  {"q": "Is this legal?", "a": "Yes. A UK Ltd company is a legitimate legal entity. Millions of non-UK residents own and operate UK companies. There is nothing unusual or grey about this."},
  {"q": "Can I do this for my existing Nigerian business?", "a": "Yes. Many Nigerian businesses register a UK entity for international payments while keeping their Nigerian operation. We advise on the structure during onboarding."}
]'::jsonb,
NULL, 'company_registration',
'Taiwo F.', 'Freelance Developer',
'I lost three international clients in 6 months because I could not accept Stripe payments. My UK company was registered in 2 days. I now receive $8,000/month through Stripe.',
'Lagos (operating globally)',
'UK Company Registration for Nigerians — Receive Stripe Payments | Swiipt',
'Register a UK Limited Company in 3–7 days and receive Stripe, PayPal, and international client payments. Remote registration, no UK travel required.',
FALSE),

-- 8. US LLC Formation
('us-llc-formation', 'business', 'entrepreneur',
'US LLC Registration — Access Stripe US, Mercury Bank & US Clients',
'Form a US Limited Liability Company in Wyoming or Delaware in 5–10 business days.',
'Register a US LLC and access the world''s most powerful payment infrastructure.',
'A Wyoming or Delaware LLC gives you Stripe US, Mercury business banking, and the ability to invoice US clients with a US business entity.',
'Register my US LLC', 'USA', 'company_registration',
'[
  {"step": 1, "title": "State selection", "body": "We recommend Wyoming for most Nigerian freelancers — lowest fees, strongest privacy laws, no state income tax. Delaware for businesses planning VC funding."},
  {"step": 2, "title": "Articles of Organisation", "body": "We prepare and file your Articles of Organisation with the state. Processing: 3–5 business days in Wyoming."},
  {"step": 3, "title": "EIN application", "body": "Employer Identification Number — required to open a US bank account and Stripe. We handle the IRS application. Takes 1–2 weeks by mail or phone."},
  {"step": 4, "title": "Mercury Bank + Stripe setup", "body": "We provide step-by-step guidance on opening a Mercury business bank account and applying for Stripe US under your new LLC."}
]'::jsonb,
'["Valid passport (scanned copy)", "Proposed company name", "Registered agent address (included in our service)", "Your Nigerian home address"]'::jsonb,
'[
  {"q": "What is a registered agent?", "a": "US law requires every LLC to have a registered agent — a US address that receives legal documents. We include a registered agent for 1 year in our service fee."},
  {"q": "Do I need a US address or Social Security Number?", "a": "No. Non-US residents can form a US LLC without a US address or SSN. You use a registered agent address for the company."},
  {"q": "How do US taxes work for a Nigerian-owned LLC?", "a": "A single-member LLC owned by a non-US resident with no US-source income is generally not subject to US federal income tax. We recommend consulting a US tax professional for your specific situation."},
  {"q": "What is Mercury Bank?", "a": "Mercury is a US digital bank that accepts LLCs owned by non-US residents. Once your LLC is formed and you have an EIN, Mercury is the most straightforward US banking option for Nigerian business owners."}
]'::jsonb,
NULL, 'company_registration',
'Emeka O.', 'SaaS Founder',
'My payment processor kept rejecting Nigerian accounts. A Wyoming LLC with Mercury Bank and Stripe took 10 days to set up. My conversion rate went from 0% to normal overnight.',
'Lagos (operating in USA)',
'US LLC Registration for Nigerians — Stripe US & Mercury Bank | Swiipt',
'Form a US LLC in Wyoming or Delaware. Access Stripe US, Mercury Bank, and US client invoicing. No US address or travel required.',
FALSE),

-- 9. Second Citizenship — Grenada
('grenada-citizenship-by-investment', 'citizenship', 'second_passport',
'Grenada Citizenship by Investment — Second Passport',
'One of the most powerful second passports available. Includes E-2 Treaty Investor Visa eligibility for the USA.',
'Grenada citizenship. Visa-free to 140+ countries including E-2 Treaty access to the USA.',
'The Grenada CBI program is the only Caribbean citizenship that includes E-2 Treaty Investor Visa eligibility — a direct pathway to legal business operation in America.',
'Start my Grenada Citizenship Fund', 'Grenada', 'second_citizenship',
'[
  {"step": 1, "title": "Due diligence assessment", "body": "Every CBI applicant goes through background checks. We pre-assess your profile to identify any issues before you pay government fees."},
  {"step": 2, "title": "Application preparation", "body": "We compile your full application: personal statement, source of funds documentation, police clearances from all countries of residence, medical certificate."},
  {"step": 3, "title": "Government submission", "body": "Application submitted to Grenada Citizenship by Investment Unit (CIU). Processing: 4–6 months from submission."},
  {"step": 4, "title": "Due diligence clearance", "body": "Grenada CIU conducts background checks. Once cleared, investment is made to the National Transformation Fund."},
  {"step": 5, "title": "Passport issuance", "body": "Grenada passport issued. Valid 5 years (renewable). Includes your family members if included in the application."}
]'::jsonb,
'["Valid Nigerian passport", "Police clearance certificates — all countries lived in for 6+ months", "Medical certificate", "Proof of investment funds — source of funds documentation required", "Passport photographs", "Personal and business reference letters"]'::jsonb,
'[
  {"q": "What is the minimum investment?", "a": "USD 150,000 donation to the National Transformation Fund for a single applicant. Family pricing available. Government fees are additional and not included in our service fee."},
  {"q": "Is the government fee included in Swiipt service fee?", "a": "No. Our service fee covers application management. The USD 150,000 investment is paid directly to the Grenada government."},
  {"q": "What is the E-2 Treaty benefit?", "a": "Grenada has a bilateral E-2 Investment Treaty with the USA. As a Grenada citizen you can apply for a US E-2 Investor Visa, which allows you to live in the USA as a business investor. This is the most significant benefit of Grenada citizenship for Nigerian business owners."},
  {"q": "Can my family be included?", "a": "Yes. Spouse, children under 30 (if financially dependent), parents over 55 (if financially dependent), and siblings can be included in one application for additional government fees."},
  {"q": "How powerful is the Grenada passport?", "a": "Visa-free or visa-on-arrival to 140+ countries including all EU Schengen states, UK, China, Singapore, and the Caribbean. Combined with E-2 Treaty access to the USA, it is one of the most strategically powerful second passports available through CBI."}
]'::jsonb,
NULL, 'second_citizenship',
'Babatunde A.', 'Business Owner',
'I needed access to the US market without the uncertainty of a visa application. Grenada citizenship gave me E-2 eligibility. That opened everything.',
'Lagos / USA',
'Grenada Citizenship by Investment for Nigerians — Swiipt',
'Get a Grenada second passport with E-2 Treaty Investor Visa access to the USA. Visa-free to 140+ countries. Managed application from Nigeria.',
FALSE),

-- 10. Cruise Ship Jobs
('cruise-ship-jobs-visa', 'work', 'cruise_worker',
'Cruise Ship Jobs — Visa, Medical & STCW Training',
'Everything you need to get a cruise ship job: C1/D visa, medical certificate, and STCW safety training.',
'Get a cruise ship job. We handle the visa, medical, and STCW.',
'Cruise ship workers earn in USD or EUR with free accommodation and food. Save almost everything you earn. We process the C1/D visa and arrange your pre-departure requirements.',
'Start my Cruise Career Fund', NULL, 'work_visa',
'[
  {"step": 1, "title": "Job offer secured", "body": "You apply to cruise lines directly or through licensed maritime recruitment agencies. We provide a list of verified Nigerian maritime recruiters. You need a job offer before visa processing."},
  {"step": 2, "title": "STCW safety training", "body": "Mandatory for all cruise ship crew. 5-day training in Lagos or Port Harcourt. Covers personal survival, fire prevention, and first aid. Cost: approximately $200."},
  {"step": 3, "title": "Medical examination", "body": "PEME (Pre-Employment Medical Examination) at a flag-state approved medical centre. Swiipt coordinates the appointment."},
  {"step": 4, "title": "C1/D visa application", "body": "US Crewmember visa required for ships calling at US ports (most major cruise lines). We prepare your application and advise on the interview at the US Embassy in Abuja."},
  {"step": 5, "title": "Joining port", "body": "We advise on flights to your joining port (Miami, Barcelona, Southampton, etc.) and what to pack."}
]'::jsonb,
'["Valid Nigerian passport — minimum 2 years validity recommended", "Signed employment contract from cruise line", "STCW safety certificate (we coordinate training)", "Medical fitness certificate (PEME)", "Yellow fever vaccination card", "Seaman discharge book (we advise on obtaining this)"]'::jsonb,
'[
  {"q": "Do I need experience to get a cruise ship job?", "a": "Entry-level positions (housekeeping, food and beverage, entertainment) require no previous maritime experience. Customer service, hospitality, and communication skills help. Technical and engineering roles require relevant qualifications."},
  {"q": "How much do cruise ship workers earn?", "a": "Entry-level positions: USD 800–1,200/month. With free accommodation and food, you can save USD 700–1,100/month. Mid-level roles: USD 1,500–2,500/month. Senior roles (officers, entertainers, medical): USD 3,000–6,000/month."},
  {"q": "How long is a typical contract?", "a": "Most cruise ship contracts are 6–8 months followed by 2–3 months paid leave. Many workers do 2–3 contracts saving most of their earnings before deciding on permanent relocation."},
  {"q": "What is the C1/D visa interview like?", "a": "The US Embassy interview for a crewmember visa is typically shorter than a tourist visa interview. You need your job contract, STCW certificate, and medical fitness certificate. We brief you on everything to expect."}
]'::jsonb,
NULL, 'work_visa',
'Olamide F.', 'Entertainment Host, Royal Caribbean',
'I had no idea what STCW was or that I needed a C1/D visa. Swiipt gave me a checklist and processed my visa. I have been on ships for 2 years now and saved more than I ever did in Lagos.',
'Currently at sea',
'Cruise Ship Jobs Visa for Nigerians — C1/D & STCW | Swiipt',
'Get your cruise ship C1/D visa, STCW certificate, and medical clearance. Start earning USD on cruise ships. Full processing support for Nigerians.',
FALSE),

-- 11. Germany Job Seeker Visa (Chancenkarte)
('germany-job-seeker-visa', 'work', 'job_seeker',
'Germany Opportunity Card (Chancenkarte) — Job Seeker Visa',
'Move to Germany for up to 1 year to find work. No job offer required.',
'Move to Germany without a job offer.',
'Germany''s Chancenkarte lets qualified professionals live in Germany for 12 months while actively job hunting. No job offer required — just the right qualifications.',
'Start my Germany Fund', 'Germany', 'work_visa',
'[
  {"step": 1, "title": "Points assessment", "body": "The Chancenkarte uses a points system. We calculate your score from: qualifications (3–8 pts), work experience (0–3 pts), German language skills (0–3 pts), age (0–2 pts). Minimum 6 points required."},
  {"step": 2, "title": "Qualification recognition", "body": "If your Nigerian degree or qualifications need formal recognition in Germany, we advise on the anabin database and ENIC-NARIC process. Some professions require official recognition; others do not."},
  {"step": 3, "title": "Document preparation", "body": "Bank statements (minimum €1,027/month for duration of stay), health insurance, accommodation proof, German language certificate if applicable."},
  {"step": 4, "title": "Visa application at German embassy", "body": "Application submitted at the German embassy in Abuja or Lagos. Processing: 6–12 weeks."},
  {"step": 5, "title": "Arrival and job search", "body": "Once in Germany, you have 12 months to find employment. If you find a job within 12 months you can convert to a work permit without leaving Germany."}
]'::jsonb,
'["Nigerian university degree (bachelor minimum)", "Bank statements showing €1,027/month minimum × duration of stay", "Health insurance for Germany", "Proof of accommodation in Germany (hotel booking or rental agreement)", "Language certificate if claiming language points (Goethe-Institut, TestDaF)", "Curriculum vitae in European format"]'::jsonb,
'[
  {"q": "Do I need to speak German?", "a": "No. German language skills earn you extra points but are not mandatory. Many Chancenkarte holders find English-language roles in tech, engineering, and finance without German."},
  {"q": "What jobs are most available for Nigerians in Germany?", "a": "Software engineering, data science, nursing, physiotherapy, electrical engineering, mechanical engineering, and accounting all have strong demand. Germany has severe shortages in these areas."},
  {"q": "Can my family come with me?", "a": "Not on the Chancenkarte itself. Once you find employment and convert to a work permit, you can apply for family reunification."},
  {"q": "What happens if I do not find a job in 12 months?", "a": "The Chancenkarte is a one-time visa and cannot be extended for job seeking. However, many holders find roles within 3–6 months. We advise on job search strategy before you travel."}
]'::jsonb,
'Germany', 'work_visa',
'Ifeanyi C.', 'Software Engineer, now Germany work permit holder',
'I was applying to UK and Canada for 2 years with no success. Germany Chancenkarte took 3 months to process. I had a job offer within 6 weeks of arriving in Munich.',
'Munich, Germany',
'Germany Opportunity Card (Chancenkarte) for Nigerians 2026 — Swiipt',
'Move to Germany for 1 year to find work. No job offer required. Chancenkarte processing for Nigerian professionals with university degrees.',
FALSE),

-- 12. Canton Fair China Sourcing
('canton-fair-china-sourcing', 'business', 'trade_show',
'Canton Fair China Sourcing Trip — Visa & Full Package',
'China visa processing, flights, hotel near Canton Fair, and optional sourcing support.',
'Canton Fair. Done properly.',
'The full Canton Fair trip — China business visa, return flights, hotel in Guangzhou near Pazhou Complex, airport transfers, and optional guided sourcing support.',
'Start my Canton Fair Fund', 'China', 'relocation_concierge',
'[
  {"step": 1, "title": "Canton Fair registration", "body": "We assist with your Canton Fair exhibitor badge registration at cantonfair.org.cn. Registration opens approximately 2 months before each fair."},
  {"step": 2, "title": "China business visa (M visa)", "body": "We process your M-class business visa at the Chinese embassy in Abuja. Processing: 5–10 working days. Invitation letter from a Chinese business contact or your hotel increases approval rate."},
  {"step": 3, "title": "Flights and hotel", "body": "We book your return flights Lagos–Guangzhou (via Addis Ababa or Dubai typically) and accommodation at a hotel near Pazhou Complex — the Canton Fair venue."},
  {"step": 4, "title": "Airport transfers + SIM card", "body": "Guangzhou airport pickup, hotel transfer, and a Chinese SIM card with WeChat setup — essential for communicating with suppliers."},
  {"step": 5, "title": "Optional: sourcing guide", "body": "We connect you with a Nigerian-speaking sourcing agent in Guangzhou who accompanies you on the fair floor, helps with supplier negotiations, and assists with Alibaba Trade Assurance setup."}
]'::jsonb,
'["Valid Nigerian passport — minimum 6 months validity", "Hotel booking confirmation or invitation letter from Chinese business contact", "Bank statement showing sufficient funds (USD 3,000+ recommended)", "Business registration documents (helpful for M visa)", "Yellow fever vaccination card"]'::jsonb,
'[
  {"q": "When is the Canton Fair held?", "a": "Twice a year: Phase 1 in April–May and Phase 2 in October–November. Each phase runs approximately 3 weeks. You can attend one or multiple phases."},
  {"q": "How much should I budget for the whole trip?", "a": "Visa + flights + 7-night hotel + transfers: approximately ₦800,000–₦1,100,000. Budget separately for the goods you purchase. Many Nigerian buyers source $5,000–$50,000 worth of goods per trip."},
  {"q": "Do I need to speak Mandarin?", "a": "No. Most Canton Fair suppliers have English-speaking staff or use translation apps. Our optional sourcing guide is fluent in both English and Mandarin."},
  {"q": "How do I ship goods back to Nigeria?", "a": "We connect you with a freight forwarding partner who handles door-to-door shipping from Guangzhou to Lagos or Kano, including Nigerian customs clearance."}
]'::jsonb,
NULL, 'relocation_concierge',
'Akinwale M.', 'Importer, Lagos',
'I spent 4 years going through middlemen for my China sourcing. Swiipt sorted my visa, booked my hotel 5 minutes from the fair, and connected me with a sourcing agent. My cost per trip dropped by 40%.',
'Lagos / Guangzhou',
'Canton Fair China Trip for Nigerians — Visa & Hotel | Swiipt',
'Complete Canton Fair trip package for Nigerian importers. China business visa, Guangzhou hotel, flights, airport transfers, and optional sourcing guide.',
FALSE),

-- 13. Portugal Digital Nomad
('portugal-digital-nomad-visa', 'remote', 'digital_nomad',
'Portugal D8 Digital Nomad Visa',
'EU residency for remote workers earning income from outside Portugal.',
'Live in Portugal. Keep your remote job.',
'Portugal D8 gives you EU residency as a remote worker. After 5 years you can apply for permanent residency or citizenship.',
'Start my Portugal Fund', 'Portugal', 'remote_work_visa',
'[
  {"step": 1, "title": "Income documentation", "body": "You need proof of regular remote income: USD 3,600+/month equivalent (minimum 4× Portuguese minimum wage). We advise on acceptable proof formats: employment contract, client invoices, bank statements."},
  {"step": 2, "title": "NHR tax registration (recommended)", "body": "Portugal''s Non-Habitual Resident tax regime offers significant tax benefits for new residents in certain categories. We advise on whether you qualify and how to apply."},
  {"step": 3, "title": "Document preparation", "body": "Accommodation proof in Portugal (rental agreement minimum 1 year), Portuguese NIF (tax number), health insurance, criminal background check."},
  {"step": 4, "title": "Application at Portuguese embassy", "body": "Submitted at the Portuguese embassy or consulate. Processing: 6–10 weeks. Appointment availability varies."},
  {"step": 5, "title": "AIMA registration in Portugal", "body": "Within 3 months of arriving in Portugal, you register with AIMA (immigration authority) to receive your official residency card."}
]'::jsonb,
'["Valid passport — minimum validity beyond intended stay", "Proof of remote income: minimum €1,520/month (3,040 for 2+ adults)", "Accommodation proof — rental contract in Portugal", "Portuguese NIF number (we advise on how to obtain remotely)", "Health insurance valid in Portugal", "Criminal record certificate from Nigeria (less than 3 months old)"]'::jsonb,
'[
  {"q": "What counts as proof of remote income?", "a": "An employment contract from a non-Portuguese employer, a freelance services agreement with foreign clients, or 3 months of client invoices and corresponding bank receipts. Self-employed applicants need consistent documentation."},
  {"q": "Can I work for Portuguese companies?", "a": "The D8 visa is for income from non-Portuguese sources. Working directly for a Portuguese employer on their payroll requires a different visa type."},
  {"q": "What is the NHR tax regime?", "a": "Non-Habitual Resident status gives qualifying new residents a 20% flat income tax rate on Portuguese-sourced income and potential tax exemptions on foreign income. It applies for 10 years. We advise on whether you qualify during onboarding."},
  {"q": "Is Lisbon or Porto better for Nigerian remote workers?", "a": "Lisbon has a larger African and Nigerian community, more English speakers, and more international connections. Porto is cheaper, smaller, and increasingly popular with tech workers. Both are excellent."}
]'::jsonb,
'Portugal', 'visa',
'Tokunbo A.', 'UX Designer working remotely for a UK company',
'I had been trying to figure out the Portuguese visa for 8 months. The income proof requirements confused me. Swiipt made sense of it and my D8 came through in 9 weeks.',
'Lisbon, Portugal',
'Portugal D8 Digital Nomad Visa for Nigerians 2026 — Swiipt',
'Get your Portugal D8 digital nomad visa. EU residency for remote workers. Income requirements, document preparation, and application management.',
FALSE),

-- 14. Student Proof of Funds
('uk-student-proof-of-funds', 'student', 'student_proof',
'UK Student Visa Proof of Funds — Save and Demonstrate Financial Capacity',
'Nigerian students lose UK visa applications because of the 28-day financial requirement. Swiipt solves it.',
'Never lose your UK student visa because of proof of funds again.',
'The UK Home Office requires students to show funds in a bank account for 28 consecutive days. Swiipt''s locked savings product creates this documented financial history.',
'Start my Study Fund', 'UK', 'residency_permit',
'[
  {"step": 1, "title": "Calculate your required amount", "body": "You need: 1 year tuition fees + £1,334/month for up to 9 months living costs (London) or £1,023/month (outside London). Total typically £25,000–£50,000 equivalent."},
  {"step": 2, "title": "Open a locked Swiipt savings goal", "body": "Create a UK Study Fund on Swiipt. Set the target to your required amount. Begin depositing consistently over the months before your visa application."},
  {"step": 3, "title": "Build 28 consecutive days of balance", "body": "The Home Office requires funds to have been in your account for 28 consecutive days before the visa application date. Swiipt provides a formal account statement showing your balance history."},
  {"step": 4, "title": "Visa application", "body": "We process your UK Student visa application with your university CAS number, Swiipt financial statement, IELTS results, and all required documents."}
]'::jsonb,
'["Unconditional university offer letter + CAS number", "Funds showing 28+ consecutive days: tuition fees + living costs", "IELTS Academic 6.0+ (varies by university)", "Valid passport", "Tuberculosis test certificate (if applicable)"]'::jsonb,
'[
  {"q": "How much do I need to show?", "a": "Tuition fees for your first year + £1,334/month for up to 9 months if studying in London, or £1,023/month outside London. For a £15,000/year course in London you need approximately £27,000 total."},
  {"q": "Does the money have to be in a UK bank?", "a": "No. The Home Office accepts funds held in Nigerian banks, provided the statement shows the balance has been maintained for 28 consecutive days. Swiipt savings records are formatted to meet this requirement."},
  {"q": "Can I use my parents'' money?", "a": "Yes. If your parents or official sponsor are funding your education, their bank statements showing the 28-day requirement are acceptable, provided you also show their sponsorship letter."},
  {"q": "What if I have the money but not the 28-day history?", "a": "This is the most common reason for UK student visa rejections from Nigeria. If you have the funds but applied too early, we advise on timing your application correctly."}
]'::jsonb,
NULL, 'work_visa',
'Adaora N.', 'MSc student, University of Manchester',
'My first UK visa application was rejected because I had the money but it had only been in the account for 19 days. Swiipt''s structured savings gave me the 28-day documented history for my second application.',
'Manchester, UK',
'UK Student Visa Proof of Funds for Nigerians — Swiipt',
'Never lose your UK student visa because of the 28-day financial requirement. Swiipt savings create documented proof of funds for UK visa applications.',
FALSE),

-- 15. NYSC Abroad Pathway
('nysc-move-abroad-plan', 'student', 'nysc',
'Just Finished NYSC? Your 12-Month Plan to Move Abroad',
'The moment you finish NYSC is the best time to start planning your international move.',
'Finished NYSC. Ready to move. Here is your plan.',
'Most Nigerian graduates complete NYSC with no clear international roadmap. This page gives you the exact pathway based on your qualifications and goals.',
'Start my Move Fund', NULL, 'residency_permit',
'[
  {"step": 1, "title": "Assess your strongest pathway", "body": "Use our free eligibility checker to identify whether Canada Express Entry, UK Skilled Worker, UAE work visa, Germany Chancenkarte, or company registration is your strongest 12-month option."},
  {"step": 2, "title": "Take IELTS now", "body": "IELTS is required for Canada, UK, Australia, Ireland, and Germany. Taking it while your English is sharp from university is strategic. Target band 7.5+ in all components."},
  {"step": 3, "title": "Start saving immediately", "body": "Create a savings goal on Swiipt matched to your target pathway. Even ₦30,000/month over 12 months builds the financial base you need."},
  {"step": 4, "title": "Build 12 months of verifiable work experience", "body": "Your NYSC counts as 1 year for some programs. Add 12 months of formal employment after NYSC and you qualify for most skilled immigration pathways."},
  {"step": 5, "title": "Order your service", "body": "When your savings goal reaches 25%, you unlock your first eligibility assessment. We review your full profile and advise on exact next steps."}
]'::jsonb,
'["NYSC discharge certificate", "University degree certificate", "IELTS results (or plan to take IELTS)", "Employment reference letters post-NYSC", "Valid international passport"]'::jsonb,
'[
  {"q": "Does NYSC count as work experience for immigration?", "a": "For Canada Express Entry: NYSC counts toward work experience in your NOC code if the role matches. For UK Skilled Worker: employer reference letter from your NYSC placement helps. Germany Chancenkarte: counts toward points calculation."},
  {"q": "What is the fastest pathway from NYSC to abroad?", "a": "UK company registration (5 days, gives you Stripe access immediately). UAE work visa with a job offer (8–12 weeks). Germany Chancenkarte (4–6 months). Canada Express Entry (18–30 months but starts now)."},
  {"q": "Should I get more qualifications first?", "a": "Usually not. Many graduates waste 2–3 years doing a second degree they do not need. Your bachelor degree already qualifies you for most pathways. Start the process now, not after a masters."}
]'::jsonb,
NULL, 'work_visa',
'Kelechi O.', 'Corper, batch A 2025, now UAE resident',
'I used my NYSC year to take IELTS, save on Swiipt, and sort my documents. By month 8 of service I already had my UAE entry permit.',
'Dubai, UAE',
'Just Finished NYSC? Move Abroad in 12 Months — Swiipt',
'Your 12-month international migration plan starting from NYSC completion. Canada, UK, UAE, and Germany pathways for Nigerian graduates.',
FALSE),

-- 16. Parents Funding Education Abroad
('fund-your-childs-education-abroad', 'parents', 'parent_funder',
'Fund Your Child''s International Education — Save and Prove It',
'UK, Canada, USA, and Australia universities require proof of funds. Start saving now and arrive at the visa application ready.',
'Give your child the international education they deserve.',
'Tuition fees, living costs, and visa proof of funds — planned, saved, and documented on Swiipt.',
'Start my Child Education Fund', NULL, 'residency_permit',
'[
  {"step": 1, "title": "Calculate the total cost", "body": "UK: £25,000–£60,000/year. Canada: CAD 25,000–50,000/year. USA: USD 35,000–70,000/year. Australia: AUD 35,000–60,000/year. We help you build a realistic multi-year savings plan."},
  {"step": 2, "title": "Create a locked education fund", "body": "Open a Swiipt savings goal for your child''s education. Lock it for 2–3 years to build the documented history that visa applications require."},
  {"step": 3, "title": "Document your saving history", "body": "University visa applications require bank statements. Your Swiipt savings history provides a clean, documented record of consistent saving."},
  {"step": 4, "title": "Student visa processing", "body": "When your child has a university offer, we process the student visa with their CAS number, your financial documentation, and all required supporting documents."}
]'::jsonb,
'["Your bank statement — 28 days showing required balance", "University offer letter and CAS number (your child receives this)", "Sponsorship letter (explaining you are funding your child)", "Your own passport and proof of income", "Child''s IELTS results and academic documents"]'::jsonb,
'[
  {"q": "Can I show funds spread across multiple accounts?", "a": "For UK student visas, funds need to be in one account or clearly documented across accounts with a written explanation. We advise on the cleanest approach for your specific situation."},
  {"q": "When should I start saving?", "a": "The earlier the better. The 28-day requirement means you need the full amount available at least 1 month before the visa application. For a September start, you should have funds documented by late July at the latest."},
  {"q": "Can my child work during study?", "a": "UK: 20 hours/week during term. Canada: 20 hours/week. USA: limited on F-1 visa. Australia: 48 hours per fortnight. This reduces but does not eliminate your funding requirement."}
]'::jsonb,
NULL, 'work_visa',
'Mrs. Funke A.', 'Mother of 3 — two now studying in Canada',
'I saved for 2 years on Swiipt for my first child. The documented savings history made the Canadian visa application straightforward. My second child uses the same fund.',
'Lagos',
'Fund Your Child''s International Education — Swiipt',
'Save for UK, Canada, USA, and Australia university fees. Build documented proof of funds for student visa applications. Start your education fund on Swiipt.',
FALSE),

-- 17. Honeymoon & Holiday Travel
('maldives-honeymoon-package', 'holiday', 'holiday_traveller',
'Maldives Honeymoon Package — Save and Book',
'Save toward your Maldives honeymoon on Swiipt and book when you are ready.',
'Your Maldives honeymoon. Planned and funded.',
'From ₦450,000 per person. All-inclusive. Return flights, overwater villa, transfers. Save toward it on Swiipt — book when your goal is funded.',
'Start my Maldives Fund', 'Maldives', 'holiday_package',
'[
  {"step": 1, "title": "Choose your package", "body": "Browse our Maldives packages on the Holidays tab. 4-night and 7-night options. All include return flights from Lagos, overwater accommodation, meals, and airport transfers."},
  {"step": 2, "title": "Create your savings goal", "body": "Save toward your package on Swiipt. No minimum. Save at your pace. We hold your funds securely until you are ready to book."},
  {"step": 3, "title": "Book when funded", "body": "When your goal reaches 100% of the package price, book directly from the Swiipt Holidays tab with one click."},
  {"step": 4, "title": "Travel documents", "body": "Maldives does not require a visa for Nigerian passport holders. We advise on travel insurance and what to pack."}
]'::jsonb,
'["Valid Nigerian passport — minimum 6 months validity", "Return flight booking (included in Swiipt package)", "Travel insurance (recommended — we can advise)", "Yellow fever vaccination card"]'::jsonb,
'[
  {"q": "Do Nigerians need a visa for Maldives?", "a": "No. Nigerian passport holders receive a free 30-day visa on arrival in Maldives."},
  {"q": "What is included in the package?", "a": "Return flights from Lagos, accommodation, all meals, airport boat transfer in Maldives, and snorkelling equipment. International departure taxes and travel insurance are not included."},
  {"q": "Can I customise the package?", "a": "Yes. Contact us after creating your goal and we will build a custom itinerary. Private water villa upgrades, excursions, and spa packages can be added."}
]'::jsonb,
NULL, 'holiday_package',
'Amara and Tunde B.', 'Married October 2025',
'We saved for 6 months on Swiipt and went to the Maldives for our honeymoon. The package covered everything. Nothing to organise on the day.',
'Maldives',
'Maldives Honeymoon Package for Nigerians — Save and Book | Swiipt',
'Save toward your Maldives honeymoon on Swiipt. All-inclusive packages from ₦450,000 per person. No visa required for Nigerians.',
FALSE),

-- 18. Family Reunification
('family-visa-reunification', 'move', 'family_reunion',
'Family Visa & Reunification — Bring Your Family Abroad',
'Already abroad? Bring your spouse, children, and parents to join you.',
'Reunite your family. We handle the visa.',
'If you are already in the UK, UAE, or Canada, we process your family''s dependent or spousal visa so they can join you.',
'Start my Family Visa Fund', NULL, 'work_visa',
'[
  {"step": 1, "title": "Sponsor eligibility check", "body": "We verify your salary meets the sponsorship threshold for your country and visa type. UK: £29,000/year minimum. UAE: AED 4,000–6,000/month minimum. Canada: income above LICO threshold."},
  {"step": 2, "title": "Sponsorship documentation", "body": "We help you prepare your sponsorship documents: proof of status, employment/income evidence, accommodation proof in your host country."},
  {"step": 3, "title": "Family application", "body": "We prepare your family member''s application in Nigeria: passport, relationship certificates, photographs, financial documents."},
  {"step": 4, "title": "Submission and decision", "body": "Applications submitted at the relevant embassy in Nigeria. Processing: UK 12 weeks, UAE 4–8 weeks, Canada 12–16 months (spousal sponsorship)."}
]'::jsonb,
'["Sponsor (abroad): proof of immigration status, salary slips, bank statements, accommodation proof", "Family member (in Nigeria): valid passport, relationship proof (marriage/birth certificate), police clearance, photographs"]'::jsonb,
'[
  {"q": "What is the salary requirement to sponsor my family in the UK?", "a": "From April 2024, the minimum income threshold to sponsor a spouse in the UK is £29,000/year and increases further in 2025. We check the current threshold during assessment."},
  {"q": "Can I sponsor my parents?", "a": "UK, Canada and USA have very limited parent sponsorship routes that are heavily oversubscribed. UAE does not allow parent sponsorship for most salary levels. We advise honestly on what is realistic for your specific situation."},
  {"q": "How long is the separation while the application is processed?", "a": "UK spousal visa: approximately 12 weeks. UAE dependent visa: 4–8 weeks. Canada spousal sponsorship (in-land): typically 12–16 months. We advise on which route and timing minimises separation."}
]'::jsonb,
NULL, 'work_visa',
'Emeka O.', 'UK resident since 2023',
'I spent 14 months separated from my wife while figuring out her UK visa. For my second application I used Swiipt. It came through in 11 weeks.',
'London, UK',
'Family Visa & Reunification for Nigerians Abroad — Swiipt',
'Bring your family to join you in the UK, UAE, or Canada. Spousal and dependent visa processing managed from Nigeria.',
FALSE),

-- 19. Remote Worker Tax / Global Income Setup
('global-income-setup-remote-workers', 'remote', 'remote_worker',
'Global Income Setup for Nigerian Remote Workers',
'UK company, international banking, and income structure for Nigerians earning in foreign currency.',
'You earn in USD or GBP. Let''s make sure your income structure works properly.',
'Thousands of Nigerians work remotely for foreign companies or freelance internationally. Most are using informal payment channels. We build a proper structure: company, banking, and basic compliance.',
'Start my Global Income Setup', NULL, 'company_registration',
'[
  {"step": 1, "title": "Income structure assessment", "body": "We review how you currently receive payments and identify the risks and tax implications. This is a 30-minute consultation call."},
  {"step": 2, "title": "UK company registration", "body": "We register your UK Ltd company (or US LLC) to give you a legitimate business entity for invoicing foreign clients."},
  {"step": 3, "title": "International banking setup", "body": "Wise Business account for multi-currency receiving. Optional: Mercury (US) for USD. Both accept non-UK/US residents."},
  {"step": 4, "title": "Annual compliance guidance", "body": "We connect you with a tax advisor for your annual UK Companies House confirmation statement and basic compliance. Prevents costly fines."}
]'::jsonb,
'["Valid passport", "Description of your remote work arrangement (employed vs freelance)", "Details of your current payment method", "List of countries you have worked for or invoiced in the last 12 months"]'::jsonb,
'[
  {"q": "Is it legal to receive foreign income while resident in Nigeria?", "a": "Yes. There is no Nigerian law prohibiting receiving foreign income. However, the correct declaration and management of that income has legal and tax implications we advise on."},
  {"q": "Do I need to tell my Nigerian bank about foreign income?", "a": "This depends on how and where you receive it. We advise on the cleanest approach during the assessment call."},
  {"q": "What does annual compliance for a UK company involve?", "a": "Each year you must file a Confirmation Statement with Companies House (£34 fee) and submit a company tax return. For non-UK resident owners with no UK activity, the tax return typically shows nil liability. We connect you with an accountant who handles this for approximately £150/year."}
]'::jsonb,
NULL, 'company_registration',
'Simi A.', 'Freelance Copywriter earning in USD and GBP',
'I was receiving $4,000/month through informal channels for 2 years. Swiipt set up a UK company and Wise account in a week. My income is now properly structured and I sleep better.',
'Lagos',
'Global Income Setup for Nigerian Remote Workers — Swiipt',
'UK company registration, international banking, and income structure for Nigerians earning foreign currency remotely. Proper setup in 1–2 weeks.',
FALSE),

-- 20. Corporate Staff Relocation
('corporate-staff-relocation', 'corporate', 'corporate',
'Corporate Staff Relocation — International Mobility for Nigerian Companies',
'We manage visa processing, travel, and relocation coordination for Nigerian companies sending staff abroad.',
'Send your team internationally. We handle the paperwork.',
'From one visa to a retainer covering all your international staff movements. Fixed pricing per case. Dedicated case manager.',
'Talk to our corporate team', NULL, 'relocation_concierge',
'[
  {"step": 1, "title": "Retainer assessment", "body": "We assess your annual international staff movement volume and build a pricing structure. 1–5 cases/year: per-case pricing. 6+/year: monthly retainer with volume discount."},
  {"step": 2, "title": "HR system integration", "body": "We work with your HR team to establish document checklists, timelines, and communication protocols for each staff relocation."},
  {"step": 3, "title": "Case management", "body": "Each staff relocation is managed by a dedicated Swiipt case manager. One point of contact from application to arrival."},
  {"step": 4, "title": "Monthly reporting", "body": "Monthly status report covering all active cases, pipeline cases, and cost summary. Submitted to your HR director."}
]'::jsonb,
'["Company registration certificate (Nigerian or foreign)", "HR contact person details", "Staff member passport and employment contract", "Destination country requirements (varies — we advise)"]'::jsonb,
'[
  {"q": "What is included in the corporate retainer?", "a": "Visa processing for all covered staff, document checklist management, embassy appointment coordination, and a dedicated case manager. Flight booking and accommodation can be added."},
  {"q": "How is corporate pricing structured?", "a": "We offer per-case pricing for occasional movers and monthly retainer pricing for companies with regular international staff movement. Contact us for a custom quote based on your volume and destinations."},
  {"q": "Do you cover all destinations?", "a": "Yes. We process visas and coordinate relocations to UAE, UK, Canada, Qatar, Germany, USA, and other destinations. If you have an unusual destination requirement, we advise honestly on whether we can handle it."}
]'::jsonb,
NULL, 'relocation_concierge',
'Adeyemi B.', 'HR Director, Lagos-based energy company',
'We were sending 15 staff to UAE every year through different agents with inconsistent results. Swiipt put everything on one retainer. One contact, consistent quality, monthly reporting.',
'Lagos',
'Corporate Staff Relocation Nigeria — International Mobility | Swiipt',
'Visa processing and relocation management for Nigerian companies with international staff movement. Retainer pricing, dedicated case manager.',
FALSE);
