-- RUN EACH QUERY SEPARATELY IN SUPABASE SQL EDITOR
-- Do NOT run them as one block

-- Query 1:
ALTER SYSTEM SET app.settings.internal_api_url = 'https://swiipt.com';

-- Query 2:
ALTER SYSTEM SET app.settings.internal_api_secret = 'swiipt-group-buy-secret-a1b2c3d4';

-- Query 3:
SELECT pg_reload_conf();
