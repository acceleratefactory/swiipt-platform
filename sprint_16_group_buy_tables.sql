-- Sprint 16 — System 1: Group Buy
-- Step 1.1–1.5: Tables, RLS, Indexes, Platform Settings
-- Run this in Supabase SQL Editor

-- ============================================================
-- STEP 1.1: Create group_buys table
-- ============================================================
CREATE TABLE IF NOT EXISTS group_buys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('holiday_package', 'service')),
  holiday_package_id UUID REFERENCES holiday_packages(id),
  service_package_id UUID REFERENCES service_packages(id),
  original_price_ngn NUMERIC NOT NULL,
  group_price_ngn NUMERIC NOT NULL,
  group_discount_pct NUMERIC NOT NULL,
  target_size INTEGER NOT NULL CHECK (target_size BETWEEN 2 AND 10),
  current_size INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'filled', 'expired', 'cancelled', 'completed')),
  expires_at TIMESTAMPTZ NOT NULL,
  filled_at TIMESTAMPTZ,
  payment_deadline TIMESTAMPTZ,
  invite_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 1.2: Create group_buy_members table
-- ============================================================
CREATE TABLE IF NOT EXISTS group_buy_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_buy_id UUID REFERENCES group_buys(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  status TEXT DEFAULT 'committed'
    CHECK (status IN ('committed', 'pending_payment', 'paid', 'withdrawn', 'refunded')),
  deposit_id UUID REFERENCES deposits(id),
  booking_id UUID REFERENCES holiday_bookings(id),
  order_id UUID REFERENCES service_orders(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  UNIQUE(group_buy_id, user_id)
);

-- ============================================================
-- STEP 1.3: RLS Policies
-- ============================================================
ALTER TABLE group_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_members ENABLE ROW LEVEL SECURITY;

-- Anyone can read open group buys (for invite link access)
CREATE POLICY "Anyone can read open group buys"
ON group_buys FOR SELECT
USING (status = 'open' OR creator_id = auth.uid());

-- Authenticated users can create group buys
CREATE POLICY "Users can create group buys"
ON group_buys FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Creator can update their own group buy
CREATE POLICY "Creator can update own group buy"
ON group_buys FOR UPDATE
USING (auth.uid() = creator_id);

-- Members can read their own memberships
CREATE POLICY "Users can read own memberships"
ON group_buy_members FOR SELECT
USING (auth.uid() = user_id);

-- Group members can see all members of groups they are in
CREATE POLICY "Group members can see fellow members"
ON group_buy_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_buy_members gbm
    WHERE gbm.group_buy_id = group_buy_members.group_buy_id
    AND gbm.user_id = auth.uid()
  )
);

-- Authenticated users can join groups
CREATE POLICY "Users can join group buys"
ON group_buy_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own membership (e.g. withdraw)
CREATE POLICY "Users can update own membership"
ON group_buy_members FOR UPDATE
USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can read all group buys"
ON group_buys FOR SELECT
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can read all memberships"
ON group_buy_members FOR SELECT
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update group buys"
ON group_buys FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update memberships"
ON group_buy_members FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- STEP 1.4: Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_group_buys_status ON group_buys(status);
CREATE INDEX IF NOT EXISTS idx_group_buys_invite_code ON group_buys(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_buys_creator ON group_buys(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_buy_members_group ON group_buy_members(group_buy_id);
CREATE INDEX IF NOT EXISTS idx_group_buy_members_user ON group_buy_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_buy_members_status ON group_buy_members(status);

-- ============================================================
-- STEP 1.5: Platform Settings
-- ============================================================
INSERT INTO platform_settings (key, value) VALUES
('group_buy_discounts', '{
  "2": 10,
  "3": 12,
  "4": 15,
  "5": 18,
  "6": 20,
  "7": 22,
  "8": 25,
  "9": 27,
  "10": 30
}'),
('group_buy_expiry_hours', '72'),
('group_buy_payment_window_hours', '168')
ON CONFLICT (key) DO NOTHING;
