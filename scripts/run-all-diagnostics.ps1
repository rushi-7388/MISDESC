# ==============================================================================
# MISDESC Master System Diagnostic Runner (PowerShell)
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host ">>> Launching MISDESC Master System Diagnostic Suite..." -ForegroundColor Cyan

$ScriptPath = Join-Path $PSScriptRoot "run-all-diagnostics.js"
node $ScriptPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n>>> [SUCCESS] All MISDESC diagnostics passed cleanly!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n>>> [ERROR] Diagnostic suite detected failures." -ForegroundColor Red
    exit 1
}
