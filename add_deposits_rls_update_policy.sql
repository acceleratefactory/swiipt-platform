-- Run this in Supabase SQL Editor
-- Adds the missing UPDATE policy for deposits table.
-- Previously only SELECT and INSERT policies existed (Sprint 0),
-- so users updating user_confirmed_at + expires_at were silently blocked by RLS.

CREATE POLICY "Users can update own deposits"
ON deposits FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
