-- Disable the OmniRoute provider. OmniRoute is a self-hosted gateway
-- (runs on a URL you deploy yourself) and is NOT a hosted API. Without a
-- real OMNIROUTE_URL it always fails with "fetch failed", so it only wastes
-- a fallback slot. Re-enable later if you actually stand up an OmniRoute
-- instance and set OMNIROUTE_URL + OMNIROUTE_API_KEY in Vercel.
UPDATE ai_providers
SET is_active = false
WHERE provider_slug = 'omniroute';

-- (Optional) If you want to try a different Gemini model without a deploy,
-- set GEMINI_MODEL in Vercel. Default is gemini-2.0-flash-001.
