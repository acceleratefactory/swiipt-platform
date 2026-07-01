-- ============================================================
-- Sprint 17 Phase 0 — Database Migration
-- Creates 5 new tables, users columns, RLS, indexes,
-- certificate_seq, and calculate_financial_profile function.
-- Does NOT modify any existing functions/tables/columns.
-- All CREATE TABLE / ADD COLUMN use IF NOT EXISTS guards.
-- ============================================================

-- === FINANCIAL PROFILES ===
CREATE TABLE IF NOT EXISTS financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  total_deposited_ngn NUMERIC DEFAULT 0,
  total_goals_created INTEGER DEFAULT 0,
  total_goals_completed INTEGER DEFAULT 0,
  average_monthly_deposit_ngn NUMERIC DEFAULT 0,
  deposit_consistency_score INTEGER DEFAULT 0,
  longest_streak_weeks INTEGER DEFAULT 0,
  primary_destination TEXT,
  secondary_destination TEXT,
  estimated_move_timeline TEXT,
  relocation_intent_score INTEGER DEFAULT 0,
  has_uk_company BOOLEAN DEFAULT FALSE,
  has_us_llc BOOLEAN DEFAULT FALSE,
  has_uae_company BOOLEAN DEFAULT FALSE,
  is_sme_owner BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  documents_verified_count INTEGER DEFAULT 0,
  services_completed INTEGER DEFAULT 0,
  platform_tenure_days INTEGER DEFAULT 0,
  trust_score INTEGER DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === PLATFORM CERTIFICATES ===
CREATE TABLE IF NOT EXISTS platform_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('proof_of_funds', 'trust_certificate')),
  certificate_number TEXT UNIQUE NOT NULL,
  goal_id UUID REFERENCES savings_goals(id),
  data_snapshot JSONB NOT NULL,
  verification_url TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  fee_paid_ngn NUMERIC DEFAULT 0,
  fee_deposit_id UUID REFERENCES deposits(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === PLATFORM PARTNERS (AGENTS) ===
CREATE TABLE IF NOT EXISTS platform_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  business_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  partner_type TEXT NOT NULL CHECK (partner_type IN (
    'immigration_lawyer', 'visa_agent', 'relocation_consultant',
    'trade_agent', 'recruitment_agency', 'education_consultant'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  verification_documents JSONB DEFAULT '[]',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  cac_number TEXT,
  professional_licence_number TEXT,
  years_in_operation INTEGER,
  specialisations TEXT[],
  destinations_served TEXT[],
  average_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_escrow_volume_ngn NUMERIC DEFAULT 0,
  total_escrow_transactions INTEGER DEFAULT 0,
  platform_fee_pct NUMERIC DEFAULT 5,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === ESCROW DEALS ===
CREATE TABLE IF NOT EXISTS escrow_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES platform_partners(id) NOT NULL,
  client_user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  total_amount_ngn NUMERIC NOT NULL,
  platform_fee_ngn NUMERIC NOT NULL,
  partner_payout_ngn NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'disputed', 'refunded', 'cancelled')),
  milestones JSONB DEFAULT '[]',
  savings_goal_id UUID REFERENCES savings_goals(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- === DIASPORA GIFTS (external card payments into locked goals) ===
CREATE TABLE IF NOT EXISTS diaspora_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES savings_goals(id) NOT NULL,
  recipient_user_id UUID REFERENCES users(id) NOT NULL,
  giver_name TEXT NOT NULL,
  giver_email TEXT,
  giver_country TEXT,
  amount_paid_foreign NUMERIC NOT NULL,
  foreign_currency TEXT NOT NULL,
  fx_rate_used NUMERIC NOT NULL,
  amount_credited_ngn NUMERIC NOT NULL,
  platform_fee_ngn NUMERIC NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  gift_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === RLS POLICIES ===
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaspora_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own financial profile"
  ON financial_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all financial profiles"
  ON financial_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users read own certificates"
  ON platform_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can verify a certificate by number"
  ON platform_certificates FOR SELECT USING (TRUE);

CREATE POLICY "Active partners visible to authenticated users"
  ON platform_partners FOR SELECT USING (status = 'active' OR auth.uid() IS NOT NULL);

CREATE POLICY "Deal parties can read their deals"
  ON escrow_deals FOR SELECT USING (
    auth.uid() = client_user_id OR
    EXISTS (SELECT 1 FROM platform_partners WHERE id = partner_id AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

CREATE POLICY "Recipients can read their gifts"
  ON diaspora_gifts FOR SELECT USING (auth.uid() = recipient_user_id);

-- Admin policies for all new tables
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['financial_profiles','platform_certificates','platform_partners','escrow_deals','diaspora_gifts']
  LOOP
    EXECUTE format('CREATE POLICY "Admins manage %I" ON %I FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ''admin''))', t, t);
  END LOOP;
END $$;

-- === USERS TABLE ADDITIONS ===
ALTER TABLE users ADD COLUMN IF NOT EXISTS global_profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS income_estimate_usd_monthly NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- === INDEXES ===
CREATE INDEX IF NOT EXISTS idx_financial_profiles_user ON financial_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_certificates_user ON platform_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_certificates_number ON platform_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_platform_partners_status ON platform_partners(status, partner_type);
CREATE INDEX IF NOT EXISTS idx_escrow_deals_client ON escrow_deals(client_user_id);
CREATE INDEX IF NOT EXISTS idx_escrow_deals_partner ON escrow_deals(partner_id);
CREATE INDEX IF NOT EXISTS idx_diaspora_gifts_goal ON diaspora_gifts(goal_id);

-- === CERTIFICATE NUMBER SEQUENCE ===
CREATE SEQUENCE IF NOT EXISTS certificate_seq START 1000;

-- ============================================================
-- Sprint 17 Phase 0b — Financial Profile Calculation Function
-- Does NOT modify existing functions. Only creates new one.
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_financial_profile(user_id_input UUID)
RETURNS VOID AS $$
DECLARE
  total_deposited NUMERIC := 0;
  goal_count INTEGER := 0;
  completed_goals INTEGER := 0;
  avg_monthly NUMERIC := 0;
  consistency INTEGER := 0;
  has_uk BOOLEAN := FALSE;
  docs_verified INTEGER := 0;
  services_done INTEGER := 0;
  tenure INTEGER := 0;
  trust INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_deposited
  FROM deposits WHERE user_id = user_id_input AND status = 'confirmed';

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO goal_count, completed_goals
  FROM savings_goals WHERE user_id = user_id_input;

  SELECT COALESCE(AVG(monthly_total), 0) INTO avg_monthly
  FROM (
    SELECT DATE_TRUNC('month', created_at) as month, SUM(amount) as monthly_total
    FROM deposits WHERE user_id = user_id_input AND status = 'confirmed'
    GROUP BY month
  ) monthly;

  SELECT CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at)) / (30 * 24 * 3600) < 1 THEN 0
    ELSE LEAST(100, ROUND(
      (SELECT COUNT(DISTINCT DATE_TRUNC('month', created_at)) FROM deposits WHERE user_id = user_id_input AND status = 'confirmed')::NUMERIC
      /
      GREATEST(1, EXTRACT(EPOCH FROM (NOW() - created_at)) / (30 * 24 * 3600))
      * 100
    ))
  END INTO consistency
  FROM users WHERE id = user_id_input;

  SELECT COUNT(*) > 0 INTO has_uk
  FROM service_orders so
  JOIN service_packages sp ON sp.id = so.service_package_id
  WHERE so.user_id = user_id_input AND sp.category = 'company_registration' AND sp.destination = 'UK' AND so.status = 'completed';

  SELECT COUNT(*) INTO docs_verified
  FROM document_requests WHERE user_id = user_id_input AND status = 'verified';

  SELECT COUNT(*) INTO services_done
  FROM service_orders WHERE user_id = user_id_input AND status = 'completed';

  SELECT ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)
  INTO tenure FROM users WHERE id = user_id_input;

  trust := 0;
  IF total_deposited >= 100000 THEN trust := trust + 10; END IF;
  IF total_deposited >= 500000 THEN trust := trust + 10; END IF;
  IF total_deposited >= 1000000 THEN trust := trust + 10; END IF;
  IF consistency >= 50 THEN trust := trust + 15; END IF;
  IF consistency >= 80 THEN trust := trust + 15; END IF;
  IF docs_verified >= 1 THEN trust := trust + 10; END IF;
  IF docs_verified >= 3 THEN trust := trust + 10; END IF;
  IF services_done >= 1 THEN trust := trust + 15; END IF;
  IF tenure >= 90 THEN trust := trust + 5; END IF;

  INSERT INTO financial_profiles (
    user_id, total_deposited_ngn, total_goals_created, total_goals_completed,
    average_monthly_deposit_ngn, deposit_consistency_score,
    has_uk_company, documents_verified_count, services_completed,
    platform_tenure_days, trust_score, last_calculated
  )
  VALUES (
    user_id_input, total_deposited, goal_count, completed_goals,
    avg_monthly, consistency,
    has_uk, docs_verified, services_done,
    tenure, LEAST(trust, 100), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_deposited_ngn = EXCLUDED.total_deposited_ngn,
    total_goals_created = EXCLUDED.total_goals_created,
    total_goals_completed = EXCLUDED.total_goals_completed,
    average_monthly_deposit_ngn = EXCLUDED.average_monthly_deposit_ngn,
    deposit_consistency_score = EXCLUDED.deposit_consistency_score,
    has_uk_company = EXCLUDED.has_uk_company,
    documents_verified_count = EXCLUDED.documents_verified_count,
    services_completed = EXCLUDED.services_completed,
    platform_tenure_days = EXCLUDED.platform_tenure_days,
    trust_score = EXCLUDED.trust_score,
    last_calculated = NOW();

  UPDATE users SET trust_score = LEAST(trust, 100) WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
