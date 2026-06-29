-- ============================================================
-- Sprint 16 System 2 — Trade Show Group Savings
-- Phase 2: New tables, RLS, and indexes
-- Does NOT modify any existing tables, columns, or functions
-- ============================================================

-- Trade show catalog (admin-managed)
CREATE TABLE trade_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_city TEXT NOT NULL,
  location_country TEXT NOT NULL,
  venue TEXT,
  event_date_start DATE NOT NULL,
  event_date_end DATE NOT NULL,
  registration_deadline DATE,
  category TEXT NOT NULL CHECK (category IN (
    'manufacturing', 'technology', 'fashion', 'agriculture',
    'healthcare', 'energy', 'food_beverage', 'general'
  )),
  base_cost_solo_ngn NUMERIC NOT NULL,
  base_cost_group_ngn NUMERIC,
  min_group_size INTEGER DEFAULT 3,
  max_group_size INTEGER DEFAULT 20,
  description TEXT,
  invitation_letter_fee_ngn NUMERIC DEFAULT 5000,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade show group goals
-- invite_code uses TS- prefix to avoid collision with group_buys.invite_code
CREATE TABLE trade_show_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES users(id) NOT NULL,
  trade_show_id UUID REFERENCES trade_shows(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_group_size INTEGER NOT NULL,
  current_member_count INTEGER DEFAULT 1,
  cost_per_person_ngn NUMERIC NOT NULL,
  status TEXT DEFAULT 'forming'
    CHECK (status IN ('forming', 'saving', 'funded', 'booking', 'confirmed', 'completed', 'cancelled')),
  activation_threshold_pct INTEGER DEFAULT 80,
  invite_code TEXT UNIQUE NOT NULL,
  savings_deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members of a trade show group
CREATE TABLE trade_show_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES trade_show_groups(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('organizer', 'member')),
  savings_goal_id UUID REFERENCES savings_goals(id),
  status TEXT DEFAULT 'saving'
    CHECK (status IN ('saving', 'funded', 'withdrawn', 'removed')),
  amount_saved_ngn NUMERIC DEFAULT 0,
  funded_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- RLS
ALTER TABLE trade_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_show_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_show_group_members ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read active trade shows
CREATE POLICY "Anyone can read active trade shows"
ON trade_shows FOR SELECT USING (is_active = TRUE);

-- Users: can read open/forming groups or their own groups
CREATE POLICY "Users can read open trade show groups"
ON trade_show_groups FOR SELECT
USING (status IN ('forming', 'saving') OR organizer_id = auth.uid());

CREATE POLICY "Users can create trade show groups"
ON trade_show_groups FOR INSERT
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Users can update own trade show groups"
ON trade_show_groups FOR UPDATE
USING (auth.uid() = organizer_id);

-- Members: can read members of same group
CREATE POLICY "Group members can read memberships"
ON trade_show_group_members FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM trade_show_group_members m
    WHERE m.group_id = trade_show_group_members.group_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join trade show groups"
ON trade_show_group_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trade show group membership"
ON trade_show_group_members FOR UPDATE
USING (auth.uid() = user_id);

-- Admin: full access
CREATE POLICY "Admins can manage trade shows"
ON trade_shows FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can read all trade show groups"
ON trade_show_groups FOR SELECT
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update trade show groups"
ON trade_show_groups FOR UPDATE
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX idx_trade_shows_active ON trade_shows(is_active, event_date_start);
CREATE INDEX idx_trade_show_groups_status ON trade_show_groups(status);
CREATE INDEX idx_trade_show_groups_invite ON trade_show_groups(invite_code);
CREATE INDEX idx_tsg_members_group ON trade_show_group_members(group_id);
CREATE INDEX idx_tsg_members_user ON trade_show_group_members(user_id);
