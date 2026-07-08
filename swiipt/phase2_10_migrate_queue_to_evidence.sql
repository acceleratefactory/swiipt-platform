-- ============================================================
-- Phase 2.10 — Migrate existing opportunity_queue items to evidence
-- Converts pending queue items to evidence records
-- Idempotent: only migrates items not already in evidence
-- ============================================================

INSERT INTO evidence (evidence_type, raw_data, source_url, source_name, content_hash, enrichment_status, captured_at)
SELECT
  CASE
    WHEN ingest_method = 'rss' THEN 'rss'
    WHEN ingest_method = 'api' THEN 'api'
    WHEN ingest_method = 'manual' THEN 'manual'
    WHEN ingest_method = 'url' THEN 'url'
    ELSE 'manual'
  END as evidence_type,
  jsonb_build_object(
    'title', raw_title,
    'organisation', raw_organisation,
    'description', raw_description,
    'url', raw_url,
    'deadline', raw_deadline,
    'salary', raw_salary,
    'location', raw_location,
    'requirements', raw_requirements
  ) as raw_data,
  source_url,
  source_name,
  md5(raw_url || COALESCE(raw_title, '')) as content_hash,
  CASE
    WHEN status = 'approved' THEN 'enriched'
    WHEN status = 'rejected' THEN 'failed'
    WHEN status = 'processing' THEN 'processing'
    ELSE 'pending'
  END as enrichment_status,
  ingested_at as captured_at
FROM opportunity_queue
WHERE NOT EXISTS (
  SELECT 1 FROM evidence e
  WHERE e.content_hash = md5(opportunity_queue.raw_url || COALESCE(opportunity_queue.raw_title, ''))
);

-- Verify: Run this to confirm migration
-- SELECT enrichment_status, COUNT(*) FROM evidence GROUP BY enrichment_status;
