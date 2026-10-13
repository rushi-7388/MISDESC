#!/usr/bin/env bash
# ==============================================================================
# MISDESC PostgreSQL Automated Backup Utility (Bash / Linux / Cron)
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${DIR}/../backups"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/MISDESC_backup_${TIMESTAMP}.sql.gz"

echo ">>> Starting MISDESC database backup..."
echo "Destination: ${BACKUP_FILE}"

# Dump and gzip compression
docker exec -e PGPASSWORD=MISDESC_password MISDESC-system-db-1 pg_dump -U MISDESC -d MISDESC_system | gzip > "${BACKUP_FILE}"

echo ">>> Backup complete: $(ls -lh "${BACKUP_FILE}" | awk '{print $5}')"

# Retention policy: Prune backups older than 7 days
echo ">>> Pruning backups older than 7 days..."
find "${BACKUP_DIR}" -type f -name "MISDESC_backup_*.sql.gz" -mtime +7 -exec rm -f {} \;
echo ">>> Done."
