#!/usr/bin/env bash
# ==============================================================================
# MISDESC Automated Database Backup & Disaster Recovery Utility
# ==============================================================================

set -euo pipefail

DB_USER="${POSTGRES_USER:-MISDESC}"
DB_NAME="${POSTGRES_DB:-MISDESC_system}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./database/snapshots}"

mkdir -p "$BACKUP_DIR"

usage() {
  echo "Usage: $0 [backup|restore <file>]"
  exit 1
}

backup() {
  local timestamp
  timestamp="$(date +%Y%m%d_%H%M%S)"
  local target="${BACKUP_DIR}/MISDESC_${timestamp}.sql.gz"
  echo "📦 Backing up ${DB_NAME} from ${DB_HOST}:${DB_PORT}..."
  PGPASSWORD="${POSTGRES_PASSWORD:-MISDESC_password}" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$target"
  echo "✓ Backup successfully created: ${target}"
}

restore() {
  local file="${1:-}"
  if [[ -z "$file" || ! -f "$file" ]]; then
    echo "Error: Backup file '$file' not found."
    exit 1
  fi
  echo "⚠️ Restoring ${DB_NAME} from ${file}..."
  PGPASSWORD="${POSTGRES_PASSWORD:-MISDESC_password}" gunzip -c "$file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
  echo "✓ Restoration complete."
}

case "${1:-}" in
  backup) backup ;;
  restore) restore "${2:-}" ;;
  *) usage ;;
esac
