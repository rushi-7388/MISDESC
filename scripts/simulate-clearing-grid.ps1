# ==============================================================================
# MISDESC National Clearing Grid Traffic Simulator (PowerShell)
# ==============================================================================
param (
    [int]$Cycles = 3
)

$ErrorActionPreference = "Stop"
Write-Host ">>> Launching MISDESC Clearing Grid Traffic Simulator ($Cycles cycles)..." -ForegroundColor Cyan

$ScriptPath = Join-Path $PSScriptRoot "simulate-clearing-grid.js"
node $ScriptPath $Cycles

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n>>> [SUCCESS] Interbank simulation completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n>>> [ERROR] Simulation failed." -ForegroundColor Red
    exit 1
}
