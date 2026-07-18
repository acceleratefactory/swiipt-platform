$secret = "swiipt-group-buy-secret-a1b2c3d4"
$url = "https://www.swiipt.com/api/admin/opportunities/backfill-translate"
$max = 4
$i = 0
do {
  $i++
  try {
    $r = Invoke-RestMethod -Method POST -Uri $url -Headers @{"x-internal-secret" = $secret}
    "attempt $i : translated=$($r.translated) failed=$($r.failed) err=$($r.lastError)"
    if ($r.message -like "*No non-English*" -or ($r.translated -eq 0 -and $r.failed -eq 0)) { break }
    Start-Sleep -Seconds 3
  }
  catch {
    "attempt $i : TIMEOUT/error - $($_.Exception.Message)"
    Start-Sleep -Seconds 5
  }
} while ($i -lt $max)
"DONE"
