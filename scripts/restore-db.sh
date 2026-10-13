#!/usr/bin/env bash
# ==============================================================================
# MISDESC PostgreSQL Database Restore Utility (Bash / Linux)
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${DIR}/../backups"

FILE="$1"
if [ -z "$FILE" ]; then
  FILE=$(ls -t "${BACKUP_DIR}"/MISDESC_backup_*.sql.gz 2>/dev/null | head -n 1)
  if [ -z "$FILE" ]; then
    echo "No backup archives found in ${BACKUP_DIR}"
    exit 1
  fi
fi

echo ">>> Restoring from: ${FILE}"
read -p "Proceed with restoring into MISDESC_system? (y/N): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Restore aborted."
  exit 0
fi

echo ">>> Unpacking and restoring database..."
gunzip -c "${FILE}" | docker exec -i -e PGPASSWORD=MISDESC_password MISDESC-system-db-1 psql -U MISDESC -d MISDESC_system
echo ">>> Database restored successfully!"
