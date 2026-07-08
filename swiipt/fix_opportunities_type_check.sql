-- ============================================================
-- Fix: Add 12 extended types to opportunities CHECK constraint
-- The original constraint only allowed 9 seed types
-- ============================================================

-- Drop the old CHECK constraint
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_type_check;

-- Add new CHECK constraint with all 21 types
ALTER TABLE opportunities ADD CONSTRAINT opportunities_type_check CHECK (type IN (
  'job', 'scholarship', 'fellowship', 'visa_programme',
  'sports_trial', 'remote_work', 'internship', 'training', 'grant',
  'competition', 'conference', 'exchange', 'trade_show',
  'trial', 'healthcare', 'residency', 'citizenship',
  'funding', 'contest', 'accelerator', 'award'
));

-- Verify
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'opportunities_type_check';
