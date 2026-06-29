-- ============================================================
-- Sprint 16 System 3 — Relocation Readiness Score
-- Phase 1: Create function, columns, and log table
-- Does NOT modify any existing functions, tables, or columns
-- ============================================================

-- Add columns to users table (IF NOT EXISTS = no-op if already present)
ALTER TABLE users ADD COLUMN IF NOT EXISTS readiness_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS readiness_destination TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS readiness_last_calculated TIMESTAMPTZ;

-- Score breakdown log
CREATE TABLE IF NOT EXISTS readiness_score_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  event_type TEXT NOT NULL,
  points_awarded INTEGER NOT NULL,
  running_total INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE readiness_score_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own score log"
ON readiness_score_log FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_readiness_log_user ON readiness_score_log(user_id, created_at);

-- Score calculation function (brand new function, does not modify any existing RPC)
CREATE OR REPLACE FUNCTION calculate_readiness_score(user_id_input UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  u RECORD;
  goal_count INTEGER;
  max_goal_pct NUMERIC;
  doc_count INTEGER;
  order_count INTEGER;
  completed_order_count INTEGER;
  referral_sent_count INTEGER;
  referral_completed_count INTEGER;
BEGIN
  SELECT * INTO u FROM users WHERE id = user_id_input;

  -- Identity (max 20)
  IF u.email IS NOT NULL THEN score := score + 5; END IF;
  IF u.phone IS NOT NULL AND u.phone != '' THEN score := score + 5; END IF;
  IF u.full_name IS NOT NULL AND u.country_of_residence IS NOT NULL THEN score := score + 5; END IF;

  -- Financial (max 30)
  SELECT COUNT(*), MAX(CASE WHEN target_amount > 0 THEN (current_balance / target_amount * 100) ELSE 0 END)
  INTO goal_count, max_goal_pct
  FROM savings_goals WHERE user_id = user_id_input AND status = 'active';

  IF goal_count > 0 THEN score := score + 5; END IF;
  IF max_goal_pct >= 10 THEN score := score + 5; END IF;
  IF max_goal_pct >= 25 THEN score := score + 5; END IF;
  IF max_goal_pct >= 50 THEN score := score + 5; END IF;
  IF max_goal_pct >= 75 THEN score := score + 5; END IF;
  IF max_goal_pct >= 100 THEN score := score + 5; END IF;

  -- Documents (max 20)
  SELECT COUNT(*) INTO doc_count
  FROM activity_log
  WHERE user_id = user_id_input AND event_type = 'vault_document_uploaded';

  IF doc_count >= 1 THEN score := score + 5; END IF;

  IF EXISTS (
    SELECT 1 FROM activity_log
    WHERE user_id = user_id_input
    AND event_type = 'vault_document_uploaded'
    AND event_data->>'document_type' = 'passport'
  ) THEN score := score + 5; END IF;

  IF doc_count >= 2 THEN score := score + 5; END IF;
  IF doc_count >= 3 THEN score := score + 5; END IF;

  -- Services (max 15)
  SELECT COUNT(*) INTO order_count
  FROM service_orders WHERE user_id = user_id_input;

  SELECT COUNT(*) INTO completed_order_count
  FROM service_orders WHERE user_id = user_id_input AND status = 'completed';

  IF order_count > 0 THEN score := score + 10; END IF;
  IF completed_order_count > 0 THEN score := score + 5; END IF;

  -- Engagement (max 15)
  SELECT COUNT(*) INTO referral_sent_count
  FROM referrals WHERE referrer_id = user_id_input;

  SELECT COUNT(*) INTO referral_completed_count
  FROM referrals WHERE referrer_id = user_id_input AND status = 'completed';

  IF referral_sent_count > 0 THEN score := score + 5; END IF;
  IF referral_completed_count > 0 THEN score := score + 5; END IF;

  -- Update user record
  UPDATE users SET
    readiness_score = LEAST(score, 100),
    readiness_last_calculated = NOW()
  WHERE id = user_id_input;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
