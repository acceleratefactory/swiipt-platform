-- ============================================================
-- Sprint 6 — SQL Setup (run in order)
-- ============================================================

-- 1. Set your admin user role (replace email with yours)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-admin-email@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 2. Verify admin user exists
SELECT u.email, r.role
FROM auth.users u
JOIN user_roles r ON r.user_id = u.id;

-- 3. Create recalculate_wallet_locked function
CREATE OR REPLACE FUNCTION recalculate_wallet_locked(user_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE wallets SET
    total_locked_ngn = (
      SELECT COALESCE(SUM(current_balance), 0)
      FROM savings_goals
      WHERE user_id = user_id_input
        AND is_locked = TRUE
        AND status = 'active'
    )
  WHERE user_id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create get_total_aum function
CREATE OR REPLACE FUNCTION get_total_aum()
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(total_locked_ngn), 0)
    FROM wallets
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
