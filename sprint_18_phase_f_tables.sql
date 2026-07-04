-- ============================================================
-- Sprint 18 Phase F — Affiliate University tables
-- idempotent: safe to re-run, drops nothing, only adds
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'template')),
  content_body TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  order_in_course INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT TRUE,
  points_on_completion INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  module_id UUID REFERENCES affiliate_modules(id) NOT NULL,
  completed_at TIMESTAMPTZ,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

CREATE TABLE IF NOT EXISTS affiliate_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  total_earned_ngn NUMERIC(14, 2) DEFAULT 0,
  pending_earnings_ngn NUMERIC(14, 2) DEFAULT 0,
  lifetime_earnings_ngn NUMERIC(14, 2) DEFAULT 0,
  university_points INTEGER DEFAULT 0,
  monthly_rank INTEGER,
  tier TEXT DEFAULT 'starter' CHECK (tier IN ('starter', 'bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_module_progress' AND column_name = 'completed_at') THEN
    ALTER TABLE affiliate_module_progress ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'affiliate_status' AND column_name = 'university_points') THEN
    ALTER TABLE affiliate_status ADD COLUMN university_points INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_affiliate_progress_user ON affiliate_module_progress (user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_status_tier ON affiliate_status (tier);
CREATE INDEX IF NOT EXISTS idx_affiliate_modules_order ON affiliate_modules (order_in_course ASC);
