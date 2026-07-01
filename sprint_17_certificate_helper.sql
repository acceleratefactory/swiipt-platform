-- ============================================================
-- Sprint 17 — Certificate Number Helper Function
-- Creates a function to generate formatted certificate numbers
-- using the certificate_seq created in Phase 0.
-- Accepts prefix: 'SWP-POF' (Proof of Funds) or 'SWP-TC' (Trust)
-- Additive — does not modify any existing functions/tables.
-- ============================================================

CREATE OR REPLACE FUNCTION next_certificate_number(cert_prefix TEXT DEFAULT 'SWP-POF')
RETURNS TEXT AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  seq_val := nextval('certificate_seq');
  RETURN cert_prefix || '-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(seq_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
