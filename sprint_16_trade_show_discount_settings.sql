-- ============================================================
-- Sprint 16 System 2 — Trade Show Discount Settings
-- Adds configurable discount tiers to platform_settings
-- Default: {"5": 10, "10": 15, "20": 20}
--   key = min group size to qualify
--   value = discount percentage off solo price
-- Admin can override via PlatformSettingsForm
-- ============================================================

INSERT INTO platform_settings (key, value)
VALUES ('trade_show_discounts', '{"5": 10, "10": 15, "20": 20}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
