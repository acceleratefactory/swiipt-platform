$secret = "swiipt-group-buy-secret-a1b2c3d4"
$url = "https://www.swiipt.com/api/admin/opportunities/ingest"
Invoke-RestMethod -Method POST -Uri $url -Headers @{"x-internal-secret" = $secret}
