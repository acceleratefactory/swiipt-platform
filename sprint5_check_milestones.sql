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
