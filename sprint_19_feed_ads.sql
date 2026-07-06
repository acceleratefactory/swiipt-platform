-- Feed Ads table for Sprint 19 §E
CREATE TABLE IF NOT EXISTS feed_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_type TEXT NOT NULL CHECK (ad_type IN ('internal','external')),
  advertiser_name TEXT,
  headline TEXT NOT NULL,
  body TEXT,
  cover_image_url TEXT,
  video_url TEXT,
  media_type TEXT DEFAULT 'image',
  cta_label TEXT DEFAULT 'Learn more',
  cta_url TEXT NOT NULL,
  target_segments TEXT[],
  target_countries TEXT[],
  frequency INTEGER DEFAULT 7,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','paused','ended')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  budget_impressions INTEGER,
  impression_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feed_ads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feed_ads' AND policyname = 'Admins manage feed ads') THEN
    CREATE POLICY "Admins manage feed ads"
      ON feed_ads FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_feed_ads_status ON feed_ads(status);
