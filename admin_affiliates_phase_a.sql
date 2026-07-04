-- ============================================================
-- Admin Affiliate Management — Phase A
-- Idempotent: safe to re-run, drops nothing, only adds
-- ============================================================

-- ============================================================
-- A-1: RLS — admin INSERT/UPDATE on affiliate_status
-- ============================================================
DROP POLICY IF EXISTS "Admins insert affiliate status" ON affiliate_status;
CREATE POLICY "Admins insert affiliate status" ON affiliate_status
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins update affiliate status" ON affiliate_status;
CREATE POLICY "Admins update affiliate status" ON affiliate_status
  FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ============================================================
-- A-2: RLS — admin SELECT on affiliate_module_progress
-- ============================================================
DROP POLICY IF EXISTS "Admins read all module progress" ON affiliate_module_progress;
CREATE POLICY "Admins read all module progress" ON affiliate_module_progress
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ============================================================
-- A-3: affiliate_withdrawals table (approval queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount_ngn NUMERIC(14, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_id UUID REFERENCES users(id),
  admin_note TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_status ON affiliate_withdrawals (status);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_user ON affiliate_withdrawals (user_id);

-- ============================================================
-- A-4: RLS for affiliate_withdrawals
-- ============================================================
DROP POLICY IF EXISTS "Users read own withdrawal requests" ON affiliate_withdrawals;
CREATE POLICY "Users read own withdrawal requests" ON affiliate_withdrawals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own withdrawal requests" ON affiliate_withdrawals;
CREATE POLICY "Users create own withdrawal requests" ON affiliate_withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all withdrawal requests" ON affiliate_withdrawals;
CREATE POLICY "Admins read all withdrawal requests" ON affiliate_withdrawals
  FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins update withdrawal requests" ON affiliate_withdrawals;
CREATE POLICY "Admins update withdrawal requests" ON affiliate_withdrawals
  FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
