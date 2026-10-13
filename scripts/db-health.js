#!/usr/bin/env node
// ==============================================================================
// MISDESC Database Health & Diagnostic Tool
// ==============================================================================
const { PrismaClient } = require("../backend/node_modules/@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://MISDESC:MISDESC_password@localhost:5432/MISDESC_system?schema=public",
    },
  },
});

async function main() {
  console.log("==================================================");
  console.log("   MISDESC PostgreSQL Health & Reliability Monitor    ");
  console.log("==================================================");

  const start = Date.now();
  try {
    const rawResult = await prisma.$queryRaw`
      SELECT 
        version() as pg_version,
        current_database() as database_name,
        pg_database_size(current_database()) as db_bytes
    `;

    const latencyMs = Date.now() - start;
    const dbInfo = rawResult[0];

    console.log(`[STATUS]   Connection: OK`);
    console.log(`[LATENCY]  Round-trip Ping: ${latencyMs}ms`);
    console.log(`[DATABASE] Database: ${dbInfo.database_name}`);
    console.log(`[STORAGE]  Database Size: ${(Number(dbInfo.db_bytes) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`[ENGINE]   PostgreSQL: ${dbInfo.pg_version.split(",")[0]}`);

    const [cheques, banks, users, pps, fraud, batches, clearingEvents, telemetry] = await Promise.all([
      prisma.cheque.count(),
      prisma.bank.count(),
      prisma.user.count(),
      prisma.positivePayRecord.count(),
      prisma.fraudFlag.count(),
      prisma.batch.count(),
      prisma.clearingEvent.count(),
      prisma.telemetryEvent.count(),
    ]);

    console.log("\n[TABLE RECORD COUNTS]");
    console.log(`- Participating Banks:     ${banks}`);
    console.log(`- Enterprise Users:        ${users}`);
    console.log(`- Cheques in System:       ${cheques}`);
    console.log(`- Positive Pay Records:    ${pps}`);
    console.log(`- Fraud & Forensic Flags:  ${fraud}`);
    console.log(`- Clearing Batches:        ${batches}`);
    console.log(`- Clearing Audit Events:   ${clearingEvents}`);
    console.log(`- Telemetry SRE Events:    ${telemetry}`);

    console.log("\n>>> PostgreSQL MISDESC Health check PASSED with 0 errors.");
    process.exit(0);
  } catch (err) {
    console.error("\n>>> Health check FAILED:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
