-- Sprint 16 — System 1: Group Buy
-- RLS fix: allow group members to read groups they belong to
-- Run this in Supabase SQL Editor after the tables migration
-- ============================================================

-- Allow members to read groups they are part of (complements the
-- existing "open OR creator" policy so members can see filled/completed groups)
CREATE POLICY "Members can read groups they belong to"
ON group_buys FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_buy_members
    WHERE group_buy_id = id
    AND user_id = auth.uid()
  )
);
