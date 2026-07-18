$secret = "swiipt-group-buy-secret-a1b2c3d4"
$url = "https://www.swiipt.com/api/admin/opportunities/process-queue"
$maxAttempts = 200
$attempt = 0
do {
  $attempt++
  try {
    $r = Invoke-RestMethod -Method POST -Uri $url -Headers @{"x-internal-secret" = $secret}
    "attempt $attempt : processed=$($r.processed) published=$($r.published) rejected=$($r.rejected) needsReview=$($r.needsReview)"
    if ($r.processed -eq 0) { break }
    Start-Sleep -Seconds 2
  }
  catch {
    "attempt $attempt : TIMEOUT/error - retrying in 3s"
    Start-Sleep -Seconds 3
  }
} while ($attempt -lt $maxAttempts)
"DONE (attempts=$attempt)"
