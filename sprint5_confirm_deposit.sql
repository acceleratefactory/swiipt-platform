DROP FUNCTION IF EXISTS confirm_deposit(UUID, UUID);

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
    IF EXISTS (
      SELECT 1 FROM visa_redemptions
      WHERE (deposit_id = deposit_id OR booking_fee_deposit_id = deposit_id)
        AND status = 'pending_payment'
    ) THEN
      UPDATE visa_redemptions SET
        status = 'payment_confirmed',
        updated_at = NOW()
      WHERE (deposit_id = deposit_id OR booking_fee_deposit_id = deposit_id)
        AND status = 'pending_payment';
    ELSE
      UPDATE wallets SET
        balance_ngn = balance_ngn + COALESCE(dep.ngn_equivalent, dep.amount)
      WHERE user_id = dep.user_id;
    END IF;
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

  IF dep.goal_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, action_url)
    VALUES (
      dep.user_id,
      'deposit_confirmed',
      'Deposit confirmed ✓',
      dep.currency || ' ' || dep.amount::TEXT || ' has been added to your goal.',
      '/dashboard/goals/' || dep.goal_id::TEXT
    );
  ELSEIF EXISTS (
    SELECT 1 FROM visa_redemptions
    WHERE (deposit_id = deposit_id OR booking_fee_deposit_id = deposit_id)
  ) THEN
    INSERT INTO notifications (user_id, type, title, body, action_url)
    VALUES (
      dep.user_id,
      'visa_payment_confirmed',
      'Visa payment confirmed ✓',
      'Your visa booking fee has been confirmed. Proceed to upload your passport documents.',
      '/dashboard/rewards'
    );
  ELSE
    INSERT INTO notifications (user_id, type, title, body, action_url)
    VALUES (
      dep.user_id,
      'deposit_confirmed',
      'Deposit confirmed ✓',
      dep.currency || ' ' || dep.amount::TEXT || ' has been added to your wallet.',
      '/dashboard/rewards'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
