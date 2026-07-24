ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS editorial_score INTEGER CHECK (editorial_score >= 0 AND editorial_score <= 100),
  ADD COLUMN IF NOT EXISTS content_cleaned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS content_cleaned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_opportunities_content_cleaned ON opportunities (content_cleaned) WHERE content_cleaned = FALSE;