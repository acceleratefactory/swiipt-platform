-- Fix 1: Update deduct_goal_balance to also deduct from wallets.balance_ngn for unlocked goals
-- Copy and paste into Supabase SQL Editor and run

CREATE OR REPLACE FUNCTION deduct_goal_balance(goal_id_input UUID, amount_input NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_is_locked BOOLEAN;
BEGIN
  -- Get goal metadata
  SELECT user_id, is_locked INTO v_user_id, v_is_locked
  FROM savings_goals
  WHERE id = goal_id_input;

  -- Deduct from goal balance
  UPDATE savings_goals
  SET current_balance = current_balance - amount_input
  WHERE id = goal_id_input;

  -- If goal is unlocked, also deduct from available wallet balance
  -- (locked goal balances are already excluded from balance_ngn)
  IF NOT v_is_locked THEN
    UPDATE wallets
    SET balance_ngn = balance_ngn - amount_input
    WHERE user_id = v_user_id;
  END IF;

  -- Recalculate total_locked_ngn (sum of all locked active goals)
  UPDATE wallets SET
    total_locked_ngn = (
      SELECT COALESCE(SUM(current_balance), 0)
      FROM savings_goals
      WHERE user_id = v_user_id
        AND is_locked = TRUE AND status = 'active'
    )
  WHERE user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
