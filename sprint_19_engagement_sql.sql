-- Sprint 19 — §A.4 Engagement rail (Like + Save + Share + Apply)
-- Creates opportunity_signals, user_interest_model, and opportunity_comments tables.
-- Run after sprint_19_media_system.sql in Supabase SQL editor.

-- Behavioural signals from opportunity interactions
CREATE TABLE IF NOT EXISTS opportunity_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  opportunity_id UUID REFERENCES opportunities(id) NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'view',           -- card entered viewport for 2+ seconds
    'expand',         -- user tapped card to open detail modal
    'save',           -- user tapped save/bookmark
    'apply',          -- user tapped apply now
    'dismiss',        -- user swiped away or explicitly dismissed
    'share',          -- user shared the opportunity
    'like',           -- positive interest (Phase A)
    'comment',        -- strong engagement (Phase B)
    'service_click',  -- user clicked "Need a visa? We can help"
    'dwell_long',     -- user spent 30+ seconds in detail modal
    'dwell_short'     -- user opened detail but closed in under 5 seconds
  )),
  opportunity_segment TEXT,
  opportunity_type TEXT,
  opportunity_country TEXT,
  opportunity_organisation TEXT,
  signal_weight NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interest model per user (computed from signals, updated periodically)
CREATE TABLE IF NOT EXISTS user_interest_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  segment_scores JSONB DEFAULT '{}',
  country_scores JSONB DEFAULT '{}',
  type_scores JSONB DEFAULT '{}',
  org_affinity JSONB DEFAULT '[]',
  suppressed_countries JSONB DEFAULT '[]',
  suppressed_types JSONB DEFAULT '[]',
  total_signals INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  model_confidence TEXT DEFAULT 'low' CHECK (model_confidence IN ('low', 'medium', 'high'))
);

-- Comments (Phase B — table only, no API/UI until Phase B is greenlit)
CREATE TABLE IF NOT EXISTS opportunity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  status TEXT DEFAULT 'visible' CHECK (status IN ('visible','flagged','hidden')),
  like_count INTEGER DEFAULT 0,
  parent_id UUID REFERENCES opportunity_comments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE opportunity_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interest_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunity_signals' AND policyname = 'Users can insert own signals') THEN
    CREATE POLICY "Users can insert own signals"
      ON opportunity_signals FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunity_signals' AND policyname = 'Users can read own signals') THEN
    CREATE POLICY "Users can read own signals"
      ON opportunity_signals FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_interest_model' AND policyname = 'Users can read own interest model') THEN
    CREATE POLICY "Users can read own interest model"
      ON user_interest_model FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunity_signals' AND policyname = 'Admins read all signals') THEN
    CREATE POLICY "Admins read all signals"
      ON opportunity_signals FOR SELECT
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_interest_model' AND policyname = 'Admins read all interest models') THEN
    CREATE POLICY "Admins read all interest models"
      ON user_interest_model FOR SELECT
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signals_user_type ON opportunity_signals(user_id, signal_type, created_at);
CREATE INDEX IF NOT EXISTS idx_signals_user_segment ON opportunity_signals(user_id, opportunity_segment);
CREATE INDEX IF NOT EXISTS idx_interest_model_user ON user_interest_model(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_opportunity ON opportunity_comments(opportunity_id, created_at);
