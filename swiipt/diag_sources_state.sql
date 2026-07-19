-- ============================================================
-- Diagnostic: show the live state of opportunity_sources so we can see
-- exactly which of the 14 adapter-less sources are active/working.
-- Run in Supabase SQL Editor.
-- ============================================================

SELECT
  name,
  source_type,
  trust_tier,
  is_active,
  source_status,
  source_url
FROM opportunity_sources
ORDER BY
  CASE source_status WHEN 'active' THEN 0 WHEN 'pending_scraper' THEN 1 ELSE 2 END,
  source_type,
  name;

-- Active (will be ingested) broken down by type:
SELECT source_type, count(*) AS active_count
FROM opportunity_sources
WHERE is_active = true AND source_status = 'active'
GROUP BY source_type
ORDER BY source_type;

-- How many of the original 14 adapter-less sources are now active:
SELECT count(*) AS active_of_14
FROM opportunity_sources
WHERE is_active = true
  AND source_status = 'active'
  AND name IN (
    'Andela Network Jobs','LinkedIn Nigeria Remote','Jobberman International',
    'Remote OK Africa','We Work Remotely','DAAD Scholarships','Chevening Scholarships',
    'Commonwealth Scholarships','Scholars4Dev Africa','Opportunity Desk Scholarships',
    'NHS Jobs International','NurseConnect UAE','Health Careers UK','Make It In Germany',
    'Canada IRCC Express Entry','UAE Golden Visa News','Right to Dream Africa',
    'TransferMarkt Africa Trials','Contra Remote Jobs','Canton Fair Registration',
    'GITEX Global'
  );
