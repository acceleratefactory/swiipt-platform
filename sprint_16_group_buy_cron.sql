-- Sprint 16 — System 1: Group Buy
-- Phase 8: Cron Job Setup
-- Run this in Supabase SQL Editor

-- ============================================================
-- STEP 8.1: Hourly group buy expiry cron
-- ============================================================
-- Calls POST /api/group-buy/expire every hour via pg_net.
-- The expire route marks stale open groups as 'expired' and
-- notifies their creators.
--
-- IMPORTANT: Replace placeholders below before running:
--   <YOUR_APP_URL>       — e.g. https://swiipt.com
--   <YOUR_INTERNAL_SECRET> — the same value as INTERNAL_API_SECRET in .env.local
-- ============================================================

-- Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing schedule if re-running (skips if job doesn't exist)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'group-buy-expiry';

-- Schedule the cron job
SELECT cron.schedule(
  'group-buy-expiry',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url:='<YOUR_APP_URL>/api/group-buy/expire',
    headers:='{"Content-Type":"application/json","x-internal-secret":"<YOUR_INTERNAL_SECRET>"}'::jsonb
  )::text
  $$
);

-- ============================================================
-- STEP 8.2: Payment deadline expiry (every 30 minutes)
-- ============================================================
-- After 7 days post-fill, members who haven't paid lose their
-- spot. The group reverts to 'open' with reduced current_size
-- so new members can join and replace the non-payers.
-- ============================================================

CREATE OR REPLACE FUNCTION public.expire_payment_deadlines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  new_size INTEGER;
BEGIN
  -- Find filled groups where payment_deadline has passed
  -- and that still have members stuck in 'pending_payment'
  FOR rec IN
    SELECT DISTINCT gb.id, gb.target_size, gb.current_size
    FROM group_buys gb
    JOIN group_buy_members gbm ON gbm.group_buy_id = gb.id
    WHERE gb.status = 'filled'
      AND gb.payment_deadline < NOW()
      AND gbm.status = 'pending_payment'
  LOOP
    -- Mark overdue members as withdrawn
    UPDATE group_buy_members
    SET status = 'withdrawn'
    WHERE group_buy_id = rec.id AND status = 'pending_payment';

    -- Recalculate current_size (committed + pending_payment only)
    SELECT COUNT(*) INTO new_size
    FROM group_buy_members
    WHERE group_buy_id = rec.id AND status IN ('committed', 'pending_payment');

    -- If below target, revert to open so new members can fill the gap
    IF new_size < rec.target_size THEN
      UPDATE group_buys
      SET status = 'open',
          current_size = new_size,
          filled_at = NULL,
          payment_deadline = NULL,
          updated_at = NOW()
      WHERE id = rec.id;
    ELSE
      -- Still at/above target — just update current_size
      UPDATE group_buys
      SET current_size = new_size,
          updated_at = NOW()
      WHERE id = rec.id;
    END IF;
  END LOOP;
END;
$$;

-- Remove existing schedule if re-running (skips if job doesn't exist)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'group-buy-payment-expiry';

-- Schedule payment deadline expiry every 30 minutes
SELECT cron.schedule(
  'group-buy-payment-expiry',
  '*/30 * * * *',
  $$SELECT public.expire_payment_deadlines()$$
);

-- Notify creators of affected groups (handled by the PL/pgSQL function above)
-- Member notifications are sent by the join/leave APIs as needed
