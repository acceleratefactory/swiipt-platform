-- ============================================================
-- Sprint 16 System 2 — Trade Show Seed Data
-- 6 trade shows for the initial catalog
-- Does NOT modify any existing data or tables
-- ============================================================

INSERT INTO trade_shows (
  name, location_city, location_country, venue,
  event_date_start, event_date_end, registration_deadline,
  category, base_cost_solo_ngn, base_cost_group_ngn,
  min_group_size, max_group_size, description, invitation_letter_fee_ngn
) VALUES
(
  'Canton Fair Phase 1 2027', 'Guangzhou', 'China',
  'China Import and Export Fair Complex, Pazhou',
  '2027-04-15', '2027-05-05', '2027-02-28',
  'general', 1100000, 850000, 3, 20,
  'The world''s largest trade fair. Covers electronics, machinery, building materials, hardware, and general merchandise. The single best place to source manufactured goods for Nigerian importers.',
  5000
),
(
  'Canton Fair Phase 2 2027', 'Guangzhou', 'China',
  'China Import and Export Fair Complex, Pazhou',
  '2027-05-05', '2027-05-25', '2027-03-15',
  'fashion', 1100000, 850000, 3, 20,
  'Phase 2 covers gifts, home décor, textiles, clothing, shoes, office supplies, and recreation. Best for fashion, lifestyle, and consumer goods importers.',
  5000
),
(
  'GITEX Global 2027', 'Dubai', 'UAE',
  'Dubai World Trade Centre',
  '2027-10-13', '2027-10-17', '2027-08-01',
  'technology', 950000, 750000, 3, 15,
  'The world''s largest tech event outside the USA. Best for technology buyers, digital entrepreneurs, and African tech founders seeking global partnerships.',
  5000
),
(
  'Dubai Expo City Business Events 2027', 'Dubai', 'UAE',
  'Expo City Dubai',
  '2027-03-10', '2027-03-14', '2027-01-20',
  'general', 900000, 720000, 3, 15,
  'Global business networking and exhibition at the Expo City venue. Excellent for SMEs seeking UAE distribution partnerships.',
  5000
),
(
  'Ambiente Frankfurt 2027', 'Frankfurt', 'Germany',
  'Messe Frankfurt',
  '2027-02-07', '2027-02-11', '2026-12-01',
  'general', 1450000, 1150000, 3, 12,
  'Europe''s largest consumer goods trade fair. Covers tableware, housewares, home furnishings, and gifts. Strong for Nigerian exporters of handcrafts and retailers seeking European brands.',
  5000
),
(
  'Big 5 Global Dubai 2027', 'Dubai', 'UAE',
  'Dubai World Trade Centre',
  '2027-11-24', '2027-11-27', '2027-09-01',
  'manufacturing', 900000, 720000, 3, 15,
  'Middle East''s largest construction and building materials trade show. Critical for Nigerian construction material importers and real estate developers.',
  5000
);
