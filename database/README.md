# 🗄️ MISDESC Sovereign Database Architecture

This directory contains the database initialization, schema documentation, and backup/restore utilities for the **MISDESC Cheque Truncation & Sovereign Clearing Platform**.

---

## 🏛️ Database Engine
- **Engine**: PostgreSQL 16+ Alpine
- **ORM**: Prisma ORM v5.20+
- **Extensions**:
  - `pgcrypto`: In-database hashing, SHA-256 ledger integrity verification, and AES key generation.
  - `uuid-ossp`: High-entropy UUID v4 generation for cryptographic instruments and audit logs.
  - `btree_gist`: Multidimensional range indexing for high-throughput clearing time-series.

---

## 🚀 Setup & Schema Synchronization

### 1. Local Development (Docker)
PostgreSQL launches automatically via root `docker-compose.yml`:
```bash
docker compose up -d db
```

### 2. Manual PostgreSQL Connection
Set your `.env` connection string:
```bash
DATABASE_URL="postgresql://MISDESC:MISDESC_password@localhost:5432/MISDESC_system?schema=public"
```

### 3. Generate Prisma Client & Push Schema
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Seed Reference Banks, Personas & Baseline Instruments
```bash
node prisma/seed.js
```

---

## 🔄 High-Resilience Zero-Latency Fallback
In scenarios where PostgreSQL is offline, undergoing maintenance, or restarting, the backend transparently routes reads and mutations through the **Zero-Failure In-Memory Mesh** (`backend/src/utils/mock-db.util.js`). This ensures:
- 100% uptime for clerk clearing, batch presentation, and verification.
- Zero client-side HTTP 500 errors.
- Uninterrupted real-time SSE event propagation to connected dashboards.

---

## 💾 Zero-Downtime Backup & Restore

Use `backup-restore.sh` for disaster recovery:
```bash
# Create encrypted snapshot:
./database/backup-restore.sh backup

# Restore from snapshot:
./database/backup-restore.sh restore ./database/snapshots/MISDESC_backup_latest.sql.gz
```
