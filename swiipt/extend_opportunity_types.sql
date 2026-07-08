-- ============================================================
-- Extend opportunity_types — Add 11 extended types
-- Idempotent: safe to re-run, uses ON CONFLICT DO NOTHING
-- Does NOT drop any tables, columns, functions, or constraints
-- ============================================================

-- Add extended types that FallbackTile already supports
INSERT INTO opportunity_types (slug, name, emoji, bg_color, text_color, sort_order, is_active) VALUES
  ('competition',  'Competition',   '🏆', '#7C2D12', '#F97316', 11, TRUE),
  ('conference',   'Conference',    '🌍', '#0F172A', '#334155', 12, TRUE),
  ('exchange',     'Exchange',      '✈️', '#0E7490', '#06B6D4', 13, TRUE),
  ('trade_show',   'Trade Show',    '🎪', '#4C1D95', '#7C3AED', 14, TRUE),
  ('trial',        'Trial',         '⚽', '#14532D', '#22C55E', 15, TRUE),
  ('healthcare',   'Healthcare',    '⚕️', '#0C4A6E', '#0284C7', 16, TRUE),
  ('residency',    'Residency',     '🏠', '#0F766E', '#14B8A6', 17, TRUE),
  ('citizenship',  'Citizenship',   '📜', '#1E40AF', '#6366F1', 18, TRUE),
  ('funding',      'Funding',       '💰', '#831843', '#EC4899', 19, TRUE),
  ('contest',      'Contest',       '🌟', '#92400E', '#D97706', 20, TRUE),
  ('accelerator',  'Accelerator',   '🚀', '#7C2D12', '#F97316', 21, TRUE),
  ('award',        'Award',         '🏅', '#92400E', '#D97706', 22, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- NOTE: 'sports_trial' (slug) already exists from Sprint 19 seed.
--       'trial' (slug) is added above for FallbackTile compatibility.
--       Both point to the same concept — 'trial' is the canonical name going forward.
--       Existing opportunities with type='sports_trial' will continue to work.
--       New opportunities should use type='trial'.

-- Verify: Run this to confirm all 21 types are present
-- SELECT slug, name, emoji, sort_order FROM opportunity_types ORDER BY sort_order;
