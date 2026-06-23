-- === Holiday Bookings — Full Migration ===
-- Run this in Supabase SQL Editor (safe to run multiple times)

-- 1. Create table
CREATE TABLE IF NOT EXISTS holiday_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES holiday_packages(id),
  reference TEXT NOT NULL UNIQUE,
  travellers INTEGER NOT NULL DEFAULT 1,
  currency TEXT NOT NULL DEFAULT 'NGN',
  total_price DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'payment_pending',
  case_manager_notes TEXT DEFAULT NULL,
  internal_notes TEXT DEFAULT NULL,
  documents_requested_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Safely add columns (in case table already exists without them)
ALTER TABLE holiday_bookings ADD COLUMN IF NOT EXISTS case_manager_notes TEXT DEFAULT NULL;
ALTER TABLE holiday_bookings ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT NULL;
ALTER TABLE holiday_bookings ADD COLUMN IF NOT EXISTS documents_requested_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Enable RLS
ALTER TABLE holiday_bookings ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
-- Users can see their own bookings
CREATE POLICY "Users can view own holiday bookings"
  ON holiday_bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (admin API) has full access — no explicit policy needed
-- because service_role bypasses RLS by default.

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_holiday_bookings_user_id ON holiday_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_holiday_bookings_status ON holiday_bookings(status);
CREATE INDEX IF NOT EXISTS idx_holiday_bookings_reference ON holiday_bookings(reference);

-- 6. Updated-at trigger
CREATE OR REPLACE FUNCTION update_holiday_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_holiday_bookings_updated_at ON holiday_bookings;
CREATE TRIGGER trg_holiday_bookings_updated_at
  BEFORE UPDATE ON holiday_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_holiday_bookings_updated_at();
