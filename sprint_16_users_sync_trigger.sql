-- Sprint 16 — System 1: Group Buy
-- Fix: Auto-sync auth.users → public.users
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Backfill: create public.users rows for existing auth users that are missing
INSERT INTO public.users (id, email, full_name, preferred_currency)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'NGN'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Trigger: auto-create public.users row on new auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, preferred_currency)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'NGN'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if re-running, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
