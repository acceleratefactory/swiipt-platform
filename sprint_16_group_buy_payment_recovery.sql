-- Sprint 16: Group Buy Payment Recovery
-- Adds columns to group_buy_members for payment resume/cancel support
-- Mirrors the deposits table pattern (deposits.user_confirmed_at, deposits.payment_reference)

ALTER TABLE group_buy_members
  ADD COLUMN IF NOT EXISTS user_confirmed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT DEFAULT NULL;
