-- ============================================================
-- Sprint 16 System 2 — Helper function for trade show group
-- funding check. Called by confirm_deposit after a goal-linked
-- deposit is confirmed.
-- Does NOT modify any existing functions.
-- ============================================================

CREATE OR REPLACE FUNCTION check_and_update_trade_show_group_funding(goal_id UUID)
RETURNS VOID AS $$
DECLARE
  tsg_id UUID;
  tsg_title TEXT;
  total_members INTEGER;
  funded_members INTEGER;
BEGIN
  SELECT group_id INTO tsg_id
  FROM trade_show_group_members
  WHERE savings_goal_id = goal_id
  LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'funded')
  INTO total_members, funded_members
  FROM trade_show_group_members
  WHERE group_id = tsg_id
    AND status != 'withdrawn'
    AND status != 'removed';

  IF total_members > 0 AND total_members = funded_members THEN
    SELECT title INTO tsg_title FROM trade_show_groups WHERE id = tsg_id;

    UPDATE trade_show_groups
    SET status = 'funded'
    WHERE id = tsg_id AND status IN ('forming', 'saving');

    INSERT INTO notifications (user_id, type, title, body, action_url)
    SELECT
      m.user_id,
      'trade_show_funded',
      'Group fully funded! 🎉',
      'All members have fully funded their share for "' || COALESCE(tsg_title, 'your group') || '". Your group booking is ready.',
      '/dashboard/trade-shows/groups/' || tsg_id::TEXT
    FROM trade_show_group_members m
    WHERE m.group_id = tsg_id
      AND m.status != 'withdrawn'
      AND m.status != 'removed';

    INSERT INTO notifications (user_id, type, title, body, action_url)
    SELECT
      u.id,
      'trade_show_funded_admin',
      'Trade show group fully funded',
      'All members have funded "' || COALESCE(tsg_title, 'a group') || '". Review and process the group booking.',
      '/admin/trade-shows'
    FROM user_roles u
    WHERE u.role = 'admin';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
