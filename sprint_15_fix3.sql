-- =============================================
-- Reward System Security Fixes — Full Migration
-- Run this ONCE in Supabase SQL Editor
-- =============================================

-- 1. Add tracking columns to milestone_rewards
ALTER TABLE milestone_rewards ADD COLUMN IF NOT EXISTS redeemed_as TEXT 
  CHECK (redeemed_as IN ('credit', 'service', 'visa_redemption'));

ALTER TABLE milestone_rewards ADD COLUMN IF NOT EXISTS credit_amount_ngn NUMERIC DEFAULT 0;

-- 2. Verify total_credits_ngn exists on wallets
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'wallets' AND column_name = 'total_credits_ngn';

-- 3. Add is_credit_funded safety column to savings_goals
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS is_credit_funded BOOLEAN DEFAULT FALSE;

-- 4. Add credit_applied_ngn + credit_reward_id to service_orders
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS credit_applied_ngn NUMERIC DEFAULT 0;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS credit_reward_id UUID REFERENCES milestone_rewards(id);

-- 5. Create visa_redemptions table (if not exists)
CREATE TABLE IF NOT EXISTS visa_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  reward_id UUID REFERENCES milestone_rewards(id) NOT NULL,
  booking_fee_usd NUMERIC DEFAULT 150,
  booking_fee_ngn NUMERIC NOT NULL,
  booking_fee_deposit_id UUID REFERENCES deposits(id),
  passport_photo_url TEXT,
  passport_data_page_url TEXT,
  status TEXT DEFAULT 'pending_payment' 
    CHECK (status IN ('pending_payment', 'payment_confirmed', 'documents_uploaded', 'processing', 'completed', 'cancelled')),
  service_order_id UUID REFERENCES service_orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE visa_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read own visa redemptions"
ON visa_redemptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own visa redemptions"
ON visa_redemptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can read all visa redemptions"
ON visa_redemptions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'case_manager'))
);

CREATE POLICY IF NOT EXISTS "Admins can update visa redemptions"
ON visa_redemptions FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'case_manager'))
);

-- 6. Create add_credit_to_wallet RPC
CREATE OR REPLACE FUNCTION add_credit_to_wallet(
  user_id_input UUID,
  credit_amount_input NUMERIC,
  reward_id_input UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE wallets 
  SET total_credits_ngn = total_credits_ngn + credit_amount_input
  WHERE user_id = user_id_input;

  UPDATE milestone_rewards
  SET 
    redeemed = TRUE,
    redeemed_at = NOW(),
    redeemed_as = 'credit',
    credit_amount_ngn = credit_amount_input
  WHERE id = reward_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create apply_credit_to_order RPC
CREATE OR REPLACE FUNCTION apply_credit_to_order(
  order_id_input UUID,
  user_id_input UUID,
  credit_amount_to_apply NUMERIC
) RETURNS NUMERIC AS
$$
DECLARE
  current_credit NUMERIC;
  order_price NUMERIC;
  credit_to_use NUMERIC;
  remaining_to_pay NUMERIC;
BEGIN
  SELECT total_credits_ngn INTO current_credit FROM wallets WHERE user_id = user_id_input;
  SELECT final_price INTO order_price FROM service_orders WHERE id = order_id_input;

  credit_to_use := LEAST(credit_amount_to_apply, current_credit, order_price);
  remaining_to_pay := order_price - credit_to_use;

  UPDATE wallets SET total_credits_ngn = total_credits_ngn - credit_to_use WHERE user_id = user_id_input;
  UPDATE service_orders SET credit_applied_ngn = credit_to_use, final_price = remaining_to_pay WHERE id = order_id_input;

  RETURN remaining_to_pay;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Seed hotel booking settings (admin-configurable)
INSERT INTO platform_settings (key, value, description) VALUES
  ('hotel_base_fee_usd', '150', 'Hotel booking base fee in USD (covers 3 nights)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO platform_settings (key, value, description) VALUES
  ('hotel_extra_night_fee_usd', '50', 'Fee per additional hotel night beyond the base 3 nights')
ON CONFLICT (key) DO NOTHING;

INSERT INTO platform_settings (key, value, description) VALUES
  ('hotel_min_nights', '3', 'Minimum hotel nights for visa redemption (static minimum)')
ON CONFLICT (key) DO NOTHING;
