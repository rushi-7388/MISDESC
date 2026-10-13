# ==============================================================================
# MISDESC PostgreSQL Database Restore Utility (PowerShell)
# ==============================================================================
param (
    [Parameter(Mandatory=$false)]
    [string]$File
)

$BackupDir = Join-Path $PSScriptRoot "..\backups"

if (!$File) {
    # Pick the latest backup file by default
    $LatestBackup = Get-ChildItem -Path $BackupDir -Filter "MISDESC_backup_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (!$LatestBackup) {
        Write-Host "No backup files found in $BackupDir" -ForegroundColor Red
        exit 1
    }
    $File = $LatestBackup.FullName
}

Write-Host ">>> Selected backup file: $File" -ForegroundColor Yellow
$Confirm = Read-Host "Are you sure you want to restore this backup into MISDESC_system? Existing data will be overwritten (y/N)"
if ($Confirm -ne "y" -and $Confirm -ne "Y") {
    Write-Host "Restore cancelled." -ForegroundColor Gray
    exit 0
}

Write-Host ">>> Restoring database..." -ForegroundColor Cyan
Get-Content $File | docker exec -i -e PGPASSWORD=MISDESC_password MISDESC-system-db-1 psql -U MISDESC -d MISDESC_system

if ($LASTEXITCODE -eq 0) {
    Write-Host ">>> Database restored successfully!" -ForegroundColor Green
} else {
    Write-Host ">>> Database restore encountered errors." -ForegroundColor Red
}
