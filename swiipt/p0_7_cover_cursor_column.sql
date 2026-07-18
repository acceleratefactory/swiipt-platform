-- P0#7: cursor column so the cover backfill advances past rows whose
-- image could not be stored in Storage (instead of retrying the same
-- failing rows forever). Nullable; set on every attempt (success or fail).
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cover_stored_at timestamptz;
