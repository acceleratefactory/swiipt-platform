-- =============================================
-- Run this in Supabase SQL Editor
-- Fix: Add missing columns to visa_redemptions
-- =============================================

-- 1. Add dynamic hotel booking columns to visa_redemptions
ALTER TABLE visa_redemptions ADD COLUMN IF NOT EXISTS nights INTEGER DEFAULT 3;
ALTER TABLE visa_redemptions ADD COLUMN IF NOT EXISTS total_fee_usd NUMERIC DEFAULT 150;
ALTER TABLE visa_redemptions ADD COLUMN IF NOT EXISTS base_fee_usd NUMERIC DEFAULT 150;
ALTER TABLE visa_redemptions ADD COLUMN IF NOT EXISTS extra_fee_usd NUMERIC DEFAULT 0;

-- 2. Add payment_reference column for resume flow
ALTER TABLE visa_redemptions ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- 2. Seed hotel booking settings (safe to re-run)
INSERT INTO platform_settings (key, value, description) VALUES
  ('hotel_base_fee_usd', '150', 'Hotel booking base fee in USD (covers 3 nights)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO platform_settings (key, value, description) VALUES
  ('hotel_extra_night_fee_usd', '50', 'Fee per additional hotel night beyond the base 3 nights')
ON CONFLICT (key) DO NOTHING;

INSERT INTO platform_settings (key, value, description) VALUES
  ('hotel_min_nights', '3', 'Minimum hotel nights for visa redemption (static minimum)')
ON CONFLICT (key) DO NOTHING;
