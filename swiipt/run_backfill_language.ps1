# Session 46 backfill runners
# Usage: right-click > Run with PowerShell, OR open PowerShell and run:
#   powershell -ExecutionPolicy Bypass -File .\run_backfill_language.ps1
#
# Adjust these two if needed:
$BaseUrl = "https://www.swiipt.com"
$Secret  = "swiipt-group-buy-secret-a1b2c3d4"

$headers = @{ "x-internal-secret" = $Secret }

# ---- Step 1: detect + tag language on existing rows (fast, local) ----
Write-Host "=== Step 1: backfill-language ===" -ForegroundColor Cyan
$uri1 = "$BaseUrl/api/admin/opportunities/backfill-language"
do {
    $r = Invoke-RestMethod -Method POST -Uri $uri1 -Headers $headers
    Write-Host ("language -> updated={0} failed={1} langs={2}" -f $r.updated, $r.failed, ($r.languages | ConvertTo-Json -Compress))
    Start-Sleep -Seconds 2
} while ($r.message -ne "No opportunities need language detection")
Write-Host "DONE: language backfill complete" -ForegroundColor Green

# ---- Step 2: translate tagged non-English rows to English (slow, uses AI) ----
Write-Host "=== Step 2: backfill-translate ===" -ForegroundColor Cyan
$uri2 = "$BaseUrl/api/admin/opportunities/backfill-translate"
do {
    $r = Invoke-RestMethod -Method POST -Uri $uri2 -Headers $headers
    Write-Host ("translate -> translated={0} failed={1}" -f $r.translated, $r.failed)
    Start-Sleep -Seconds 2
} while ($r.message -ne "No non-English opportunities to translate")
Write-Host "DONE: translation backfill complete" -ForegroundColor Green
