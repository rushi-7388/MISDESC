const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const models = [
    "bank",
    "user",
    "batch",
    "cheque",
    "fraudFlag",
    "clearingEvent",
    "settlement",
    "telemetryEvent",
    "positivePayRecord",
    "liquidityPool",
    "liquidityEvent",
    "disputeClaim",
    "disputeAuditLog",
    "digitalCertificate",
    "batchSignatureAudit",
    "smartChequeContract",
    "escrowMilestone",
    "microLien",
    "zkProofRecord",
    "pqcManifest",
    "swarmDocket",
    "sanctionsLog",
    "webhookSubscription",
    "webhookDelivery",
    "bankReport",
  ];

  console.log("=== CURRENT TABLE RECORD COUNTS ===");
  for (const m of models) {
    if (prisma[m]) {
      const count = await prisma[m].count();
      console.log(m.padEnd(25), ":", count);
    } else {
      console.log(m.padEnd(25), ": [MODEL NOT FOUND]");
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
