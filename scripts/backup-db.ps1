# ==============================================================================
# MISDESC PostgreSQL Automated Backup Utility (PowerShell)
# Backs up the MISDESC PostgreSQL database with timestamping and 7-day retention prune.
# ==============================================================================

$BackupDir = Join-Path $PSScriptRoot "..\backups"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "MISDESC_backup_$Timestamp.sql"

Write-Host ">>> Starting MISDESC database backup..." -ForegroundColor Cyan
Write-Host "Destination: $BackupFile" -ForegroundColor Gray

# Execute pg_dump via running docker container MISDESC-system-db-1
docker exec -e PGPASSWORD=MISDESC_password MISDESC-system-db-1 pg_dump -U MISDESC -d MISDESC_system -F p > $BackupFile

if ($LASTEXITCODE -eq 0 -and (Test-Path $BackupFile)) {
    $FileSize = (Get-Item $BackupFile).Length / 1KB
    Write-Host ">>> Backup completed successfully! ($([math]::Round($FileSize, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host ">>> ERROR: Database backup failed." -ForegroundColor Red
    exit 1
}

# Retention Policy: Prune backups older than 7 days
Write-Host ">>> Pruning backups older than 7 days..." -ForegroundColor Gray
Get-ChildItem -Path $BackupDir -Filter "MISDESC_backup_*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item -Force
Write-Host ">>> Done." -ForegroundColor Green
