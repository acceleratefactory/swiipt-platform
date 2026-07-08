-- ============================================================
-- Gap 1 — Add 7+ more watcher sources
-- FIFA academy, university scholarships, government funding
-- ============================================================

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'FIFA Academy Trials', 'watcher', 'https://www.fifa.com/legal-for-players/agents', 'footballer', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'FIFA Academy Trials');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Aspire Academy Qatar', 'watcher', 'https://www.aspire.qa/en/football', 'footballer', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Aspire Academy Qatar');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Fulbright Programme', 'watcher', 'https://us.fulbrightonline.org/about', 'student', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Fulbright Programme');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Gates Cambridge', 'watcher', 'https://www.gatescambridge.org/about/', 'student', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Gates Cambridge');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'USAID Funding', 'watcher', 'https://www.usaid.gov/about-us/agency-policy/series-300-references/303-310', 'entrepreneur', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'USAID Funding');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'DFID UK Funding', 'watcher', 'https://www.gov.uk/government/organisations/department-for-international-development', 'entrepreneur', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'DFID UK Funding');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'World Bank Funding', 'watcher', 'https://www.worldbank.org/en/about/financing', 'entrepreneur', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'World Bank Funding');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'Chevening Scholarships', 'watcher', 'https://www.chevening.org/scholarships/', 'student', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Chevening Scholarships');

INSERT INTO opportunity_sources (name, source_type, source_url, segment_slug, trust_tier, is_active, pull_frequency_hours)
SELECT 'DAAD Scholarships', 'watcher', 'https://www.daad.de/en/study-and-research-in-germany/scholarships/', 'student', 'trusted', true, 48
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'DAAD Scholarships');

-- Verify
-- SELECT name, source_type, is_active FROM opportunity_sources WHERE source_type = 'watcher' ORDER BY name;
