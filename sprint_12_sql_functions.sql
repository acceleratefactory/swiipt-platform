-- ============================================================
-- Sprint 12 — SQL Functions for Admin Analytics
-- Run in Supabase SQL editor (Production + Staging + Dev)
-- ============================================================

-- 1. Signups per day for the last N days
-- Used by: Admin Analytics → UserGrowthChart
CREATE OR REPLACE FUNCTION get_signups_by_day(days_back INTEGER)
RETURNS TABLE(signup_date DATE, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as signup_date,
    COUNT(*) as count
  FROM users
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY signup_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Total AUM (Assets Under Management)
-- Used by: Admin Overview + Admin Analytics
-- Sum of all locked balances across all wallets
CREATE OR REPLACE FUNCTION get_total_aum()
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(total_locked_ngn), 0)
    FROM wallets
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Sprint 12 — Performance Indexes
-- Run after functions above
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_savings_goals_user_status ON savings_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deposits_user_status ON deposits(user_id, status);
CREATE INDEX IF NOT EXISTS idx_service_orders_user_status ON service_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_activity_log_user_type ON activity_log(user_id, event_type);
