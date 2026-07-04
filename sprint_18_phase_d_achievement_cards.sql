-- ============================================================
-- Sprint 18 Phase D — Achievement Cards
-- idempotent: safe to re-run, drops nothing, only adds
-- ============================================================

-- Create table if not present
CREATE TABLE IF NOT EXISTS achievement_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  card_type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT 'Swiipt — Plan, fund, and execute your global move',
  data JSONB DEFAULT '{}',
  is_shared_whatsapp BOOLEAN DEFAULT FALSE,
  is_shared_instagram BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if missing (safe for re-runs after partial creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievement_cards' AND column_name = 'is_shared_whatsapp') THEN
    ALTER TABLE achievement_cards ADD COLUMN is_shared_whatsapp BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievement_cards' AND column_name = 'is_shared_instagram') THEN
    ALTER TABLE achievement_cards ADD COLUMN is_shared_instagram BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievement_cards' AND column_name = 'is_dismissed') THEN
    ALTER TABLE achievement_cards ADD COLUMN is_dismissed BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievement_cards' AND column_name = 'subtitle') THEN
    ALTER TABLE achievement_cards ADD COLUMN subtitle TEXT DEFAULT 'Swiipt — Plan, fund, and execute your global move';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievement_cards' AND column_name = 'data') THEN
    ALTER TABLE achievement_cards ADD COLUMN data JSONB DEFAULT '{}';
  END IF;
END $$;

-- Drop old index if it references missing columns, then recreate safely
DROP INDEX IF EXISTS idx_achievement_cards_user_live;
CREATE INDEX IF NOT EXISTS idx_achievement_cards_user_live
  ON achievement_cards (user_id, created_at DESC)
  WHERE is_dismissed = FALSE;
