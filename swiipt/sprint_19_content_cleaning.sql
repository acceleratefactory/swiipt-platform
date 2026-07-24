-- Sprint 19 Content Cleaning — Phase 1: Database columns
-- Adds 4 columns to the opportunities table for the AI content cleaner pipeline.
-- Run this in Supabase SQL Editor before deploying Phase 1 code.

-- The 600-char clean description for the detail page (card preview uses existing `description` at 200 chars)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS full_description TEXT;

-- Editorial quality score 0-100 from the content cleaner
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS editorial_score INTEGER DEFAULT 0;

-- Tracking flags for the content cleaning pipeline
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS content_cleaned BOOLEAN DEFAULT FALSE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS content_cleaned_at TIMESTAMPTZ;