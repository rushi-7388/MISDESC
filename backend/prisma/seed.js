const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hash = await bcrypt.hash("password123", 10);

  const bankA = await prisma.bank.upsert({
    where: { ifsc: "SPCB0001234" },
    update: { name: "SURAT PEOPLES CO OP BANK" },
    create: { name: "SURAT PEOPLES CO OP BANK", ifsc: "SPCB0001234", code: "SPCB" },
  });

  const bankB = await prisma.bank.upsert({
    where: { ifsc: "HDFC0005678" },
    update: { name: "SURAT PEOPLES CO OP BANK" },
    create: { name: "SURAT PEOPLES CO OP BANK", ifsc: "HDFC0005678", code: "HDB" },
  });

  await prisma.user.upsert({
    where: { email: "presenting@snb.com" },
    update: {},
    create: {
      name: "Presenting Bank Clerk",
      email: "presenting@snb.com",
      password: hash,
      role: "PRESENTING_BANK",
      bankId: bankA.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "drawee@hdb.com" },
    update: {},
    create: {
      name: "Drawee Bank Verifier",
      email: "drawee@hdb.com",
      password: hash,
      role: "DRAWEE_BANK",
      bankId: bankB.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "checker@hdb.com" },
    update: {},
    create: {
      name: "Drawee Bank Senior Approver (Checker)",
      email: "checker@hdb.com",
      password: hash,
      role: "DRAWEE_BANK",
      bankId: bankB.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@MISDESC.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@MISDESC.com",
      password: hash,
      role: "ADMIN",
      bankId: bankA.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@snb.com" },
    update: {},
    create: {
      name: "Rajesh Varma (Branch Manager)",
      email: "manager@snb.com",
      password: hash,
      role: "BRANCH_MANAGER",
      branchName: "Athwa Lines Branch",
      bankId: bankA.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "itops@MISDESC.com" },
    update: {},
    create: {
      name: "Neha Sharma (Core SRE & IT Staff)",
      email: "itops@MISDESC.com",
      password: hash,
      role: "IT_STAFF",
      branchName: "Central Switch Infrastructure",
      bankId: bankA.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "auditor@rbi.org.in" },
    update: {},
    create: {
      name: "Vikram Mehta (Compliance Auditor)",
      email: "auditor@rbi.org.in",
      password: hash,
      role: "COMPLIANCE_AUDITOR",
      branchName: "Regulatory Oversight Wing",
      bankId: bankA.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "treasury@MISDESC.com" },
    update: {},
    create: {
      name: "Pooja Hegde (Settlement Officer)",
      email: "treasury@MISDESC.com",
      password: hash,
      role: "SETTLEMENT_OFFICER",
      branchName: "National Treasury Settlement Desk",
      bankId: bankA.id,
    },
  });

  await prisma.batch.upsert({
    where: { sessionCode: "SESSION-MORNING-01" },
    update: {},
    create: {
      sessionName: "Standard Morning Clearing Cycle",
      sessionCode: "SESSION-MORNING-01",
      status: "OPEN",
    },
  });

  // Seed Positive Pay Records (Pre-registered by drawer account holders)
  await prisma.positivePayRecord.upsert({
    where: {
      accountNumber_chequeNumber: {
        accountNumber: "123456789012",
        chequeNumber: "000123",
      },
    },
    update: {
      payeeName: "Sample Payee",
      amount: 50000,
      chequeDate: new Date(),
      status: "REGISTERED",
    },
    create: {
      accountNumber: "123456789012",
      chequeNumber: "000123",
      payeeName: "Sample Payee",
      amount: 50000,
      chequeDate: new Date(),
      status: "REGISTERED",
      bankId: bankB.id,
    },
  });

  // Pre-registered high value record matching ₹1,50,000 cheque
  await prisma.positivePayRecord.upsert({
    where: {
      accountNumber_chequeNumber: {
        accountNumber: "987654321098",
        chequeNumber: "450122",
      },
    },
    update: {
      payeeName: "Acme Corp",
      amount: 150000,
      chequeDate: new Date(),
      status: "REGISTERED",
    },
    create: {
      accountNumber: "987654321098",
      chequeNumber: "450122",
      payeeName: "Acme Corp",
      amount: 150000,
      chequeDate: new Date(),
      status: "REGISTERED",
      bankId: bankB.id,
    },
  });

  // Discrepancy test record: registered for ₹75,000 with payee "Delta Logistics"
  await prisma.positivePayRecord.upsert({
    where: {
      accountNumber_chequeNumber: {
        accountNumber: "555666777888",
        chequeNumber: "998877",
      },
    },
    update: {
      payeeName: "Delta Logistics",
      amount: 75000,
      chequeDate: new Date(),
      status: "REGISTERED",
    },
    create: {
      accountNumber: "555666777888",
      chequeNumber: "998877",
      payeeName: "Delta Logistics",
      amount: 75000,
      chequeDate: new Date(),
      status: "REGISTERED",
      bankId: bankB.id,
    },
  });

  // Seed Central Bank Intraday Liquidity Pools
  await prisma.liquidityPool.upsert({
    where: { bankId: bankA.id },
    update: {},
    create: {
      bankId: bankA.id,
      allocatedCollateral: 15000000.0, // ₹1.5 Crore
      creditLine: 3000000.0, // ₹30 Lakhs
      currentExposure: 150000.0,
      status: "HEALTHY",
    },
  });

  await prisma.liquidityPool.upsert({
    where: { bankId: bankB.id },
    update: {},
    create: {
      bankId: bankB.id,
      allocatedCollateral: 20000000.0, // ₹2.0 Crore
      creditLine: 5000000.0, // ₹50 Lakhs
      currentExposure: 450000.0,
      status: "HEALTHY",
    },
  });

  // Seed X.509 PKI Digital Signature Certificates
  await prisma.digitalCertificate.upsert({
    where: { certThumbprint: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0" },
    update: {
      subject: "CN=SURAT PEOPLES CO OP BANK MISDESC Presentation Signer, OU=Digital Clearing, O=SURAT PEOPLES CO OP BANK, C=IN",
    },
    create: {
      bankId: bankA.id,
      certThumbprint: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
      serialNumber: "MISDESC-PKI-SNB-2026-001",
      issuer: "MISDESC National PKI Root Trust CA",
      subject: "CN=SURAT PEOPLES CO OP BANK MISDESC Presentation Signer, OU=Digital Clearing, O=SURAT PEOPLES CO OP BANK, C=IN",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      keyAlgorithm: "RSA-4096 / SHA-256",
    },
  });

  await prisma.digitalCertificate.upsert({
    where: { certThumbprint: "f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef1" },
    update: {
      subject: "CN=SURAT PEOPLES CO OP BANK MISDESC Authorization Signer, OU=Inward Operations, O=SURAT PEOPLES CO OP BANK, C=IN",
    },
    create: {
      bankId: bankB.id,
      certThumbprint: "f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef1",
      serialNumber: "MISDESC-PKI-HDB-2026-002",
      issuer: "MISDESC National PKI Root Trust CA",
      subject: "CN=SURAT PEOPLES CO OP BANK MISDESC Authorization Signer, OU=Inward Operations, O=SURAT PEOPLES CO OP BANK, C=IN",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      keyAlgorithm: "RSA-4096 / SHA-256",
    },
  });

  console.log("Seed complete with Intraday Liquidity Pools and PKI Certificates.");
  console.log("Login with password123 for:");
  console.log("- presenting@snb.com (Clerk - Presenting)");
  console.log("- drawee@hdb.com (Verifier - Drawee Maker)");
  console.log("- checker@hdb.com (Senior Approver - Drawee Checker)");
  console.log("- admin@MISDESC.com (System Administrator)");
  console.log("- manager@snb.com (Branch Operations Manager)");
  console.log("- itops@MISDESC.com (Core SRE & IT Staff)");
  console.log("- auditor@rbi.org.in (Compliance & Regulatory Auditor)");
  console.log("- treasury@MISDESC.com (Treasury & Settlement Officer)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
