-- Sprint 19 — §A.3 Media system
-- Run in Supabase SQL editor.

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image','video','none')),
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS media_source TEXT DEFAULT 'fetched' CHECK (media_source IN ('fetched','custom','fallback')),
  ADD COLUMN IF NOT EXISTS media_aspect_ratio TEXT DEFAULT '16:9',
  ADD COLUMN IF NOT EXISTS org_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS service_cta_type TEXT,
  ADD COLUMN IF NOT EXISTS service_url TEXT;

COMMENT ON COLUMN opportunities.cover_image_url IS 'Primary card image (OG fetch, custom upload, or fallback)';
COMMENT ON COLUMN opportunities.video_url IS 'Optional embeddable video (mp4/HLS/YouTube/Vimeo)';
COMMENT ON COLUMN opportunities.media_type IS 'What kind of media this card shows';
COMMENT ON COLUMN opportunities.thumbnail_url IS 'Low-res preview or video poster frame';
COMMENT ON COLUMN opportunities.media_source IS 'How the media was obtained';
COMMENT ON COLUMN opportunities.media_aspect_ratio IS 'Display aspect ratio (default 16:9)';
COMMENT ON COLUMN opportunities.org_logo_url IS 'Small brand logo shown by title';
COMMENT ON COLUMN opportunities.published_at IS 'When the opportunity was published (freshness filter)';
COMMENT ON COLUMN opportunities.service_cta_type IS 'CTA category: visa, proof_of_funds, ielts, docs';
COMMENT ON COLUMN opportunities.service_url IS 'Resolved service URL at publish time';
