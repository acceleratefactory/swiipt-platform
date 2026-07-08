-- ============================================================
-- Phase 4 — Add 'watcher' type + Seed 3 embassy watcher sources
-- Run this single file in Supabase SQL Editor
-- ============================================================

-- Step 1: Add 'watcher' to source_type check constraint
ALTER TABLE opportunity_sources DROP CONSTRAINT IF EXISTS opportunity_sources_source_type_check;

ALTER TABLE opportunity_sources
  ADD CONSTRAINT opportunity_sources_source_type_check
  CHECK (source_type IN ('rss', 'api', 'scraper', 'manual', 'watcher'));

-- Step 2: Seed embassy watcher sources
INSERT INTO opportunity_sources (name, source_type, source_url, trust_tier, is_active, pull_frequency_hours)
SELECT 'US Visa Bulletin', 'watcher', 'https://travel.state.gov/content/travel/en/usvisas/immigrate/the-immigrant-visa-process/visa-bulletin.html', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'US Visa Bulletin');

INSERT INTO opportunity_sources (name, source_type, source_url, trust_tier, is_active, pull_frequency_hours)
SELECT 'UK Visa Updates', 'watcher', 'https://www.gov.uk/government/organisations/uk-visas-and-immigration', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'UK Visa Updates');

INSERT INTO opportunity_sources (name, source_type, source_url, trust_tier, is_active, pull_frequency_hours)
SELECT 'Canada Immigration Updates', 'watcher', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/new-life-canada/benefits.html', 'trusted', true, 24
WHERE NOT EXISTS (SELECT 1 FROM opportunity_sources WHERE name = 'Canada Immigration Updates');

-- Verify: Run this to confirm
-- SELECT name, source_type, is_active, source_url FROM opportunity_sources WHERE source_type = 'watcher';
