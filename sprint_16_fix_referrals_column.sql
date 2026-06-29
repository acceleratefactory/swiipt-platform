-- ============================================================
-- Fix: calculate_readiness_score references wrong column name
-- on referrals table.
--
-- Root cause: line 95 queries referrals.status but the actual
-- column is referrals.commission_status.
--
-- This error was masked by the ambiguous deposit_id error in
-- confirm_deposit (fixed in sprint_16_fix_ambiguous_deposit_id.sql).
-- Now that confirm_deposit proceeds past the gate, it calls
-- calculate_readiness_score unconditionally, which hits this
-- column mismatch.
--
-- Only one line changed: status → commission_status
-- ============================================================

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
  FROM referrals WHERE referrer_id = user_id_input AND commission_status = 'completed';

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
