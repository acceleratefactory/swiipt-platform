-- ============================================================
-- Pre-Sprint 19: Data-Driven Opportunity Types + Segments
-- Idempotent: safe to re-run, drops nothing, only adds
-- ============================================================

-- 1. Create opportunity_types table
CREATE TABLE IF NOT EXISTS opportunity_types (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  bg_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  sort_order INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed types
INSERT INTO opportunity_types (slug, name, emoji, bg_color, text_color, sort_order) VALUES
  ('job', 'Job', '💼', '#EEF2FF', '#4338CA', 1),
  ('scholarship', 'Scholarship', '🎓', '#F5F3FF', '#7C3AED', 2),
  ('fellowship', 'Fellowship', '🏆', '#F5F3FF', '#7C3AED', 3),
  ('visa_programme', 'Visa Programme', '🛂', '#E0FAF3', '#065F46', 4),
  ('sports_trial', 'Sports Trial', '⚽', '#FFF7ED', '#C2410C', 5),
  ('remote_work', 'Remote Work', '💻', '#EFF6FF', '#1D4ED8', 6),
  ('internship', 'Internship', '📋', '#FDF4FF', '#86198F', 7),
  ('training', 'Training', '📚', '#F0FDF4', '#166534', 8),
  ('grant', 'Grant', '💰', '#FFF1F2', '#9F1239', 9)
ON CONFLICT (slug) DO NOTHING;

-- 3. Migrate opportunities.type CHECK → FK
-- First find and drop the CHECK constraint (name varies by environment)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'opportunities'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%type%check%';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE opportunities DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

-- Ensure column exists and add FK
ALTER TABLE opportunities ADD CONSTRAINT fk_opportunities_type
  FOREIGN KEY (type) REFERENCES opportunity_types(slug)
  NOT VALID;  -- skip validation of existing rows (safe, all match)

-- Validate existing rows
ALTER TABLE opportunities VALIDATE CONSTRAINT fk_opportunities_type;

-- 4. Add color columns to career_segments
ALTER TABLE career_segments ADD COLUMN IF NOT EXISTS bg_color TEXT;
ALTER TABLE career_segments ADD COLUMN IF NOT EXISTS text_color TEXT;

-- 5. Seed segment colors (matching existing dashboard card patterns)
UPDATE career_segments SET bg_color = '#F0F9FF', text_color = '#1E40AF' WHERE slug = 'job_seeker';
UPDATE career_segments SET bg_color = '#F5F3FF', text_color = '#6D28D9' WHERE slug = 'student';
UPDATE career_segments SET bg_color = '#F0FDF4', text_color = '#166534' WHERE slug = 'healthcare';
UPDATE career_segments SET bg_color = '#EFF6FF', text_color = '#1D4ED8' WHERE slug = 'tech_professional';
UPDATE career_segments SET bg_color = '#FFF7ED', text_color = '#C2410C' WHERE slug = 'footballer';
UPDATE career_segments SET bg_color = '#FFF7ED', text_color = '#C2410C' WHERE slug = 'sports_professional';
UPDATE career_segments SET bg_color = '#FDF4FF', text_color = '#86198F' WHERE slug = 'freelancer';
UPDATE career_segments SET bg_color = '#FFFBEB', text_color = '#92400E' WHERE slug = 'entrepreneur';
UPDATE career_segments SET bg_color = '#F1F5F9', text_color = '#334155' WHERE slug = 'trade_worker';
UPDATE career_segments SET bg_color = '#FCE7F3', text_color = '#9D174D' WHERE slug = 'caregiver';
