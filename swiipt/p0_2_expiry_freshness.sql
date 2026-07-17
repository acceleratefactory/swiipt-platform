-- ============================================================
-- P0#2 — Expiry & freshness (2026-07-17)
-- Problem: opportunities stay is_active=true forever, even when their
-- deadline is months past. Users see "Apply by March 2025" in July 2026.
-- Fix: (a) a function + pg_cron to auto-expire stale rows; (b) feed/search
-- queries already filter on is_active (done in code). This migration adds
-- the expiry logic + a column to record WHY it expired.
--
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================

-- Track expiry reason + when it happened (audit-friendly).
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expiry_reason TEXT;

-- Soft TTL (days) for items with NO deadline: they age out too, so the
-- feed does not fill with ancient AI-generated posts.
-- (Kept as a function constant; tune as needed.)
CREATE OR REPLACE FUNCTION expire_stale_opportunities()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_expired_deadline INTEGER := 0;
  v_expired_ttl       INTEGER := 0;
  v_grace_days        INTEGER := 7;          -- grace after deadline
  v_ttl_days          INTEGER := 120;        -- max age when deadline is null
  v_cutoff            TIMESTAMPTZ;
BEGIN
  v_cutoff := now();

  -- 1) Past-deadline items (with a 7-day grace) -> expire.
  UPDATE opportunities
  SET is_active = false,
      expired_at = v_cutoff,
      expiry_reason = 'deadline_passed'
  WHERE is_active = true
    AND deadline IS NOT NULL
    AND deadline::timestamptz < (v_cutoff - (v_grace_days || ' days')::interval);
  GET DIAGNOSTICS v_expired_deadline = ROW_COUNT;

  -- 2) No-deadline items older than TTL -> expire (keep feed fresh).
  UPDATE opportunities
  SET is_active = false,
      expired_at = v_cutoff,
      expiry_reason = 'ttl_expired'
  WHERE is_active = true
    AND deadline IS NULL
    AND published_at IS NOT NULL
    AND published_at::timestamptz < (v_cutoff - (v_ttl_days || ' days')::interval);
  GET DIAGNOSTICS v_expired_ttl = ROW_COUNT;

  RETURN v_expired_deadline + v_expired_ttl;
END;
$$;

-- pg_cron: run every day at 03:15 UTC (after ingest/process-queue windows).
-- Safe no-op if pg_cron extension is not enabled yet.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove any prior job with this name to avoid duplicates.
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire_stale_opportunities') THEN
      PERFORM cron.unschedule('expire_stale_opportunities');
    END IF;
    PERFORM cron.schedule(
      'expire_stale_opportunities',
      '15 3 * * *',
      'SELECT expire_stale_opportunities();'
    );
  END IF;
END $$;

-- Optional manual one-off (also safe to run now to clean existing stale rows):
-- SELECT expire_stale_opportunities();

-- Verify:
-- SELECT expiry_reason, COUNT(*) FROM opportunities WHERE expired_at IS NOT NULL GROUP BY 1;
-- SELECT COUNT(*) FROM opportunities WHERE is_active = true AND deadline < now();
