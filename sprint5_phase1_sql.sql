-- =============================================================
-- Sprint 5 — Phase 1: Prerequisites & Setup
-- Run these 4 blocks in order in Supabase SQL Editor
-- =============================================================

-- -------------------------------------------------------------
-- BLOCK 0: Check what already exists (run this first, paste full result)
-- -------------------------------------------------------------
SELECT
  (SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'confirm_deposit'))::text AS confirm_deposit_exists,
  (SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_and_unlock_milestones'))::text AS milestones_function_exists,
  (SELECT COUNT(*)::text FROM platform_settings WHERE key IN ('bank_name','bank_account_number','bank_account_name','milestone_25_label','milestone_50_label','milestone_75_label','milestone_100_label','milestone_100_discount_pct')) AS platform_settings_found;

-- -------------------------------------------------------------
-- BLOCK 1: Supabase Realtime
-- -------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE deposits;

-- -------------------------------------------------------------
-- BLOCK 2: confirm_deposit function
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION confirm_deposit(deposit_id UUID, admin_id UUID)
RETURNS VOID AS $$
DECLARE
  dep RECORD;
  pct NUMERIC;
  goal RECORD;
BEGIN
  SELECT * INTO dep FROM deposits WHERE id = deposit_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit not found or already processed'; END IF;

  UPDATE deposits SET
    status = 'confirmed',
    admin_confirmed_at = NOW(),
    confirmed_by = admin_id
  WHERE id = deposit_id;

  IF dep.goal_id IS NOT NULL THEN
    UPDATE savings_goals SET
      current_balance = current_balance + dep.amount
    WHERE id = dep.goal_id;

    SELECT current_balance, target_amount INTO goal FROM savings_goals WHERE id = dep.goal_id;
    pct := (goal.current_balance / goal.target_amount) * 100;

    PERFORM check_and_unlock_milestones(dep.goal_id, dep.user_id, pct);
  ELSE
    UPDATE wallets SET
      balance_ngn = balance_ngn + COALESCE(dep.ngn_equivalent, dep.amount)
    WHERE user_id = dep.user_id;
  END IF;

  UPDATE wallets SET
    total_locked_ngn = (
      SELECT COALESCE(SUM(current_balance), 0)
      FROM savings_goals
      WHERE user_id = dep.user_id AND is_locked = TRUE AND status = 'active'
    )
  WHERE user_id = dep.user_id;

  IF NOT EXISTS (
    SELECT 1 FROM deposits
    WHERE user_id = dep.user_id AND status = 'confirmed' AND id != deposit_id
  ) THEN
    PERFORM increment_mobility_score(dep.user_id, 50);
  END IF;

  INSERT INTO activity_log (user_id, event_type, event_data)
  VALUES (dep.user_id, 'deposit_confirmed', jsonb_build_object(
    'amount', dep.amount,
    'currency', dep.currency,
    'goal_id', dep.goal_id
  ));

  INSERT INTO notifications (user_id, type, title, body, action_url)
  VALUES (
    dep.user_id,
    'deposit_confirmed',
    'Deposit confirmed ✓',
    dep.currency || ' ' || dep.amount::TEXT || ' has been added to your goal.',
    '/dashboard/goals/' || dep.goal_id::TEXT
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- BLOCK 3: check_and_unlock_milestones function
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_and_unlock_milestones(
  goal_id_input UUID,
  user_id_input UUID,
  current_pct NUMERIC
)
RETURNS VOID AS $$
DECLARE
  g RECORD;
  label_25 TEXT; label_50 TEXT; label_75 TEXT; label_100 TEXT;
  discount_pct TEXT;
BEGIN
  SELECT * INTO g FROM savings_goals WHERE id = goal_id_input;

  SELECT value INTO label_25 FROM platform_settings WHERE key = 'milestone_25_label';
  SELECT value INTO label_50 FROM platform_settings WHERE key = 'milestone_50_label';
  SELECT value INTO label_75 FROM platform_settings WHERE key = 'milestone_75_label';
  SELECT value INTO label_100 FROM platform_settings WHERE key = 'milestone_100_label';
  SELECT value INTO discount_pct FROM platform_settings WHERE key = 'milestone_100_discount_pct';

  IF current_pct >= 25 AND NOT g.milestone_25_unlocked THEN
    UPDATE savings_goals SET milestone_25_unlocked = TRUE WHERE id = goal_id_input;
    INSERT INTO milestone_rewards (goal_id, user_id, milestone_type, reward_type, reward_label, reward_value_description, expires_at)
    VALUES (goal_id_input, user_id_input, '25_percent', 'free_service', COALESCE(label_25, 'Free Eligibility Assessment'), 'Free eligibility assessment by our team.', NOW() + INTERVAL '6 months');
    PERFORM increment_mobility_score(user_id_input, 75);
    INSERT INTO notifications (user_id, type, title, body, action_url)
    VALUES (user_id_input, 'milestone_unlocked', '🎯 25% milestone unlocked!', 'You unlocked: ' || COALESCE(label_25, 'Free Eligibility Assessment'), '/dashboard/rewards');
  END IF;

  IF current_pct >= 50 AND NOT g.milestone_50_unlocked THEN
    UPDATE savings_goals SET milestone_50_unlocked = TRUE WHERE id = goal_id_input;
    INSERT INTO milestone_rewards (goal_id, user_id, milestone_type, reward_type, reward_label, reward_value_description, expires_at)
    VALUES (goal_id_input, user_id_input, '50_percent', 'priority_access', COALESCE(label_50, 'Priority Processing'), 'Your application moves to the front of the queue.', NOW() + INTERVAL '6 months');
    PERFORM increment_mobility_score(user_id_input, 100);
    INSERT INTO notifications (user_id, type, title, body, action_url)
    VALUES (user_id_input, 'milestone_unlocked', '🔓 Halfway there!', 'You unlocked: ' || COALESCE(label_50, 'Priority Processing'), '/dashboard/rewards');
  END IF;

  IF current_pct >= 75 AND NOT g.milestone_75_unlocked THEN
    UPDATE savings_goals SET milestone_75_unlocked = TRUE WHERE id = goal_id_input;
    INSERT INTO milestone_rewards (goal_id, user_id, milestone_type, reward_type, reward_label, reward_value_description, expires_at)
    VALUES (goal_id_input, user_id_input, '75_percent', 'free_service', COALESCE(label_75, 'Free Consultation'), 'Free 30-min destination specialist consultation.', NOW() + INTERVAL '6 months');
    PERFORM increment_mobility_score(user_id_input, 125);
    INSERT INTO notifications (user_id, type, title, body, action_url)
    VALUES (user_id_input, 'milestone_unlocked', '🚀 75% funded!', 'You unlocked: ' || COALESCE(label_75, 'Free Consultation'), '/dashboard/rewards');
  END IF;

  IF current_pct >= 100 AND NOT g.milestone_100_unlocked THEN
    UPDATE savings_goals SET milestone_100_unlocked = TRUE WHERE id = goal_id_input;
    INSERT INTO milestone_rewards (goal_id, user_id, milestone_type, reward_type, reward_label, reward_value_description, expires_at)
    VALUES (goal_id_input, user_id_input, '100_percent', 'service_discount', COALESCE(label_100, '15% Service Discount'), COALESCE(discount_pct, '15') || '% off your full service package.', NOW() + INTERVAL '12 months');
    PERFORM increment_mobility_score(user_id_input, 200);
    INSERT INTO notifications (user_id, type, title, body, action_url)
    VALUES (user_id_input, 'milestone_unlocked', '🏆 Goal fully funded!', 'You are ready to move. Your discount is waiting.', '/dashboard/rewards');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- BLOCK 4: Platform settings rows
-- -------------------------------------------------------------
INSERT INTO platform_settings (key, value) VALUES
  ('bank_name', 'Swiipt Bank Account'),
  ('bank_account_number', '0123456789'),
  ('bank_account_name', 'Swiipt Technologies Ltd'),
  ('milestone_25_label', 'Free Eligibility Assessment'),
  ('milestone_50_label', 'Priority Processing'),
  ('milestone_75_label', 'Free Consultation'),
  ('milestone_100_label', '15% Service Discount'),
  ('milestone_100_discount_pct', '15')
ON CONFLICT (key) DO NOTHING;
