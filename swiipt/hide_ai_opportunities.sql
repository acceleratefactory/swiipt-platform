-- ============================================================
-- HIDE all AI-generated opportunities (keep seed rows visible)
-- ============================================================
-- This sets is_active = false for every opportunity where
-- ai_generated = true. Seed/manual opportunities are untouched.
-- The data stays in the DB — this is a soft-hide.
-- To restore later, run the RESTORE script below.
-- ============================================================

UPDATE opportunities
SET is_active = false
WHERE ai_generated = true
  AND is_active = true;

-- Verify: count hidden
SELECT CONCAT(
  (SELECT COUNT(*) FROM opportunities WHERE ai_generated = true AND is_active = false),
  ' AI-generated opportunities hidden. ',
  (SELECT COUNT(*) FROM opportunities WHERE is_active = true),
  ' total active (seed + manual) remaining.'
) AS result;


-- ============================================================
-- RESTORE — run this later to bring AI-generated back
-- ============================================================
/*
UPDATE opportunities
SET is_active = true
WHERE ai_generated = true
  AND is_active = false;

SELECT CONCAT(
  'Restored ',
  COUNT(*),
  ' AI-generated opportunities.'
) AS result FROM opportunities
WHERE ai_generated = true AND is_active = true;
*/