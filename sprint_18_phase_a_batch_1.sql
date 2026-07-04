-- ============================================================
-- Sprint 18 — Phase A Batch 1: Foundation Tables + RLS + Indexes
-- Run in Supabase SQL Editor. All statements are idempotent.
-- ============================================================

-- 4.1 Career Segments
CREATE TABLE IF NOT EXISTS career_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_slug TEXT NOT NULL REFERENCES career_segments(slug),
  title TEXT NOT NULL,
  organisation TEXT NOT NULL,
  location_country TEXT NOT NULL,
  location_city TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'job', 'scholarship', 'fellowship', 'visa_programme',
    'sports_trial', 'remote_work', 'internship', 'training', 'grant'
  )),
  description TEXT NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  funding_amount TEXT,
  deadline DATE,
  application_url TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  related_service_slug TEXT,
  related_goal_template_id UUID REFERENCES goal_templates(id),
  source_url TEXT,
  source_name TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_relevance_score INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  apply_click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 User Opportunity Feed
CREATE TABLE IF NOT EXISTS user_opportunity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) NOT NULL,
  relevance_score INTEGER DEFAULT 0,
  is_saved BOOLEAN DEFAULT FALSE,
  is_applied BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,
  saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- 4.4 Career Profiles
CREATE TABLE IF NOT EXISTS career_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  segment_slug TEXT REFERENCES career_segments(slug),
  "current_role" TEXT,
  years_experience INTEGER,
  highest_qualification TEXT,
  field_of_study TEXT,
  certifications TEXT[],
  desired_roles TEXT[],
  desired_countries TEXT[],
  desired_salary_usd_monthly INTEGER,
  employment_type TEXT[],
  current_level TEXT,
  gpa NUMERIC,
  ielts_score NUMERIC,
  gre_score INTEGER,
  study_fields TEXT[],
  target_universities TEXT[],
  scholarship_interest BOOLEAN DEFAULT FALSE,
  sport TEXT,
  "position" TEXT,
  current_club TEXT,
  target_leagues TEXT[],
  video_url TEXT,
  freelancer_platforms TEXT[],
  hourly_rate_usd INTEGER,
  portfolio_url TEXT,
  availability TEXT,
  visa_status TEXT,
  passport_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.5 Users Table — Tier Columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'free'
  CHECK (user_tier IN ('free', 'plus', 'pro', 'ambassador'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_unlocked_via TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_unlocked_at TIMESTAMPTZ;

-- 4.6 Tier Upgrade Function
CREATE OR REPLACE FUNCTION check_and_upgrade_tier(user_id_input UUID)
RETURNS TEXT AS $$
DECLARE
  referral_count INTEGER;
  current_tier TEXT;
BEGIN
  SELECT user_tier INTO current_tier FROM users WHERE id = user_id_input;
  SELECT COUNT(*) INTO referral_count FROM referrals
    WHERE referrer_id = user_id_input AND status = 'completed';

  IF referral_count >= 10 AND current_tier NOT IN ('pro', 'ambassador') THEN
    UPDATE users SET user_tier = 'pro', tier_unlocked_via = 'referrals', tier_unlocked_at = NOW()
    WHERE id = user_id_input;
    RETURN 'pro';
  ELSIF referral_count >= 3 AND current_tier = 'free' THEN
    UPDATE users SET user_tier = 'plus', tier_unlocked_via = 'referrals', tier_unlocked_at = NOW()
    WHERE id = user_id_input;
    RETURN 'plus';
  END IF;

  RETURN current_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.7 Affiliate Modules
CREATE TABLE IF NOT EXISTS affiliate_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'article', 'quiz', 'template', 'tool')),
  content_url TEXT,
  content_body TEXT,
  duration_minutes INTEGER,
  order_in_course INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT TRUE,
  min_affiliate_tier TEXT DEFAULT 'starter',
  points_on_completion INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.8 Affiliate Module Progress
CREATE TABLE IF NOT EXISTS affiliate_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  module_id UUID REFERENCES affiliate_modules(id) NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- 4.9 Affiliate Status
CREATE TABLE IF NOT EXISTS affiliate_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  tier TEXT DEFAULT 'starter' CHECK (tier IN ('starter', 'bronze', 'silver', 'gold', 'platinum')),
  tier_upgraded_at TIMESTAMPTZ,
  total_earned_ngn NUMERIC DEFAULT 0,
  pending_earnings_ngn NUMERIC DEFAULT 0,
  withdrawn_earnings_ngn NUMERIC DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  converting_referrals INTEGER DEFAULT 0,
  conversion_rate_pct NUMERIC DEFAULT 0,
  custom_affiliate_code TEXT UNIQUE,
  custom_landing_page_slug TEXT,
  tracking_pixel_code TEXT,
  modules_completed INTEGER DEFAULT 0,
  university_certificate_issued BOOLEAN DEFAULT FALSE,
  monthly_rank INTEGER,
  all_time_rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.10 Achievement Cards
CREATE TABLE IF NOT EXISTS achievement_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN (
    'goal_created', 'milestone_25', 'milestone_50', 'milestone_75', 'goal_funded',
    'service_ordered', 'service_completed', 'visa_approved',
    'readiness_score', 'streak_achieved', 'certificate_issued',
    'joined_swiipt', 'first_deposit'
  )),
  title TEXT NOT NULL,
  subtitle TEXT,
  data JSONB NOT NULL,
  image_url TEXT,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.11 Viral Campaigns
CREATE TABLE IF NOT EXISTS viral_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('credits', 'goal_contribution', 'service_discount', 'cash')),
  reward_amount_ngn NUMERIC NOT NULL,
  reward_per_invite BOOLEAN DEFAULT FALSE,
  invites_target INTEGER,
  requires_segment TEXT,
  min_readiness_score INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.12 Campaign Participations
CREATE TABLE IF NOT EXISTS campaign_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES viral_campaigns(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  invites_sent INTEGER DEFAULT 0,
  invites_converted INTEGER DEFAULT 0,
  reward_earned_ngn NUMERIC DEFAULT 0,
  reward_paid BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, user_id)
);

-- 4.13 Success Stories
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  order_id UUID REFERENCES service_orders(id),
  first_name TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  service_completed TEXT NOT NULL,
  journey_duration TEXT,
  approximate_cost_range TEXT,
  hardest_part TEXT,
  advice TEXT,
  photo_url TEXT,
  open_to_contact BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.14 RLS Policies (with drop guards)
ALTER TABLE career_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_opportunity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads active career segments" ON career_segments;
CREATE POLICY "Anyone reads active career segments" ON career_segments FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Authenticated users read active opportunities" ON opportunities;
CREATE POLICY "Authenticated users read active opportunities" ON opportunities FOR SELECT USING (is_active = TRUE AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone reads active viral campaigns" ON viral_campaigns;
CREATE POLICY "Anyone reads active viral campaigns" ON viral_campaigns FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Anyone reads affiliate modules" ON affiliate_modules;
CREATE POLICY "Anyone reads affiliate modules" ON affiliate_modules FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users read own opportunity feed" ON user_opportunity_feed;
CREATE POLICY "Users read own opportunity feed" ON user_opportunity_feed FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own opportunity feed" ON user_opportunity_feed;
CREATE POLICY "Users manage own opportunity feed" ON user_opportunity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own opportunity feed" ON user_opportunity_feed;
CREATE POLICY "Users update own opportunity feed" ON user_opportunity_feed FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own career profile" ON career_profiles;
CREATE POLICY "Users read own career profile" ON career_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own career profile" ON career_profiles;
CREATE POLICY "Users manage own career profile" ON career_profiles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own module progress" ON affiliate_module_progress;
CREATE POLICY "Users read own module progress" ON affiliate_module_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own module progress" ON affiliate_module_progress;
CREATE POLICY "Users manage own module progress" ON affiliate_module_progress FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own affiliate status" ON affiliate_status;
CREATE POLICY "Users read own affiliate status" ON affiliate_status FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own achievement cards" ON achievement_cards;
CREATE POLICY "Users read own achievement cards" ON achievement_cards FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own campaign participations" ON campaign_participations;
CREATE POLICY "Users read own campaign participations" ON campaign_participations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own stories" ON success_stories;
CREATE POLICY "Users can insert own stories" ON success_stories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Published stories visible to all authenticated users" ON success_stories;
CREATE POLICY "Published stories visible to all authenticated users" ON success_stories FOR SELECT USING (status = 'published' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage career segments" ON career_segments;
CREATE POLICY "Admins manage career segments" ON career_segments FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage opportunities" ON opportunities;
CREATE POLICY "Admins manage opportunities" ON opportunities FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins read all feeds" ON user_opportunity_feed;
CREATE POLICY "Admins read all feeds" ON user_opportunity_feed FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage modules" ON affiliate_modules;
CREATE POLICY "Admins manage modules" ON affiliate_modules FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins read all affiliate status" ON affiliate_status;
CREATE POLICY "Admins read all affiliate status" ON affiliate_status FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage campaigns" ON viral_campaigns;
CREATE POLICY "Admins manage campaigns" ON viral_campaigns FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins read all participations" ON campaign_participations;
CREATE POLICY "Admins read all participations" ON campaign_participations FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage all stories" ON success_stories;
CREATE POLICY "Admins manage all stories" ON success_stories FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 4.15 Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_segment ON opportunities(segment_slug, is_active);
CREATE INDEX IF NOT EXISTS idx_opportunities_featured ON opportunities(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON opportunities(type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_feed_user ON user_opportunity_feed(user_id, is_dismissed);
CREATE INDEX IF NOT EXISTS idx_career_profiles_segment ON career_profiles(segment_slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_status_tier ON affiliate_status(tier, total_earned_ngn);
CREATE INDEX IF NOT EXISTS idx_achievement_cards_user ON achievement_cards(user_id, card_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON viral_campaigns(is_active, ends_at);
