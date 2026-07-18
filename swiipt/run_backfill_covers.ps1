$secret = "swiipt-group-buy-secret-a1b2c3d4"
$url = "https://www.swiipt.com/api/admin/opportunities/backfill-covers"
$max = 100
$i = 0
do {
  $i++
  try {
    $r = Invoke-RestMethod -Method POST -Uri $url -Headers @{"x-internal-secret" = $secret}
    "run $i : updated=$($r.updated) failed=$($r.failed) msg=$($r.message)"
    if ($r.message -like "*No opportunities*") { break }
    Start-Sleep -Seconds 2
  }
  catch {
    "run $i : TIMEOUT/error - retrying in 3s"
    Start-Sleep -Seconds 3
  }
} while ($i -lt $max)
"DONE (runs=$i)"
