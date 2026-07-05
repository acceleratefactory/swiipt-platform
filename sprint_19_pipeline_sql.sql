-- Sprint 19 — §C Pipeline: opportunity_queue + opportunity_sources tables
-- Run after sprint_19_media_system.sql and sprint_19_engagement_sql.sql in Supabase SQL editor.

-- Raw opportunity queue (unvalidated ingestion)
CREATE TABLE IF NOT EXISTS opportunity_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_title TEXT,
  raw_organisation TEXT,
  raw_location TEXT,
  raw_description TEXT,
  raw_salary TEXT,
  raw_deadline TEXT,
  raw_url TEXT NOT NULL,
  raw_requirements TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  ingest_method TEXT NOT NULL CHECK (ingest_method IN ('rss', 'scraper', 'api', 'manual', 'ai_generated')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'needs_review')),
  confidence_score NUMERIC,
  ai_enriched_data JSONB,
  rejection_reason TEXT,
  review_notes TEXT,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  published_opportunity_id UUID REFERENCES opportunities(id)
);

-- Source registry (which sources to pull from)
CREATE TABLE IF NOT EXISTS opportunity_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('rss', 'api', 'scraper', 'manual')),
  source_url TEXT NOT NULL,
  segment_slug TEXT REFERENCES career_segments(slug),
  is_active BOOLEAN DEFAULT TRUE,
  pull_frequency_hours INTEGER DEFAULT 24,
  last_pulled_at TIMESTAMPTZ,
  total_ingested INTEGER DEFAULT 0,
  total_published INTEGER DEFAULT 0,
  trust_tier TEXT DEFAULT 'standard' CHECK (trust_tier IN ('trusted', 'standard', 'review_all')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add needs_review columns to opportunities
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS review_reason TEXT;

-- RLS
ALTER TABLE opportunity_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_sources ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunity_queue' AND policyname = 'Admins manage opportunity queue') THEN
    CREATE POLICY "Admins manage opportunity queue"
      ON opportunity_queue FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunity_sources' AND policyname = 'Admins manage opportunity sources') THEN
    CREATE POLICY "Admins manage opportunity sources"
      ON opportunity_sources FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_queue_status ON opportunity_queue(status, ingested_at);
CREATE INDEX IF NOT EXISTS idx_queue_source ON opportunity_queue(source_name);
CREATE INDEX IF NOT EXISTS idx_sources_active ON opportunity_sources(is_active, trust_tier);
CREATE INDEX IF NOT EXISTS idx_sources_segment ON opportunity_sources(segment_slug);
