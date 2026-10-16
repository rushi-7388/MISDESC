const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

function sha256(data) {
  return crypto.createHash("sha256").update(typeof data === "string" ? data : JSON.stringify(data)).digest("hex");
}

async function main() {
  console.log("==================================================================");
  console.log("   MISDESC ENTERPRISE BULK DATABASE SEEDER (ALL 25 TABLES)");
  console.log("==================================================================");

  const hash = await bcrypt.hash("password123", 10);

  // ============================================================================
  // 1. BANKS (10 Scheduled Commercial & Cooperative Banks)
  // ============================================================================
  console.log("[1/25] Seeding Banks...");
  const bankDefs = [
    { code: "SPCB", ifsc: "SPCB0001234", name: "SURAT PEOPLES CO OP BANK" },
    { code: "HDB",  ifsc: "HDFC0005678", name: "HDFC BANK LTD" },
    { code: "SBIN", ifsc: "SBIN0000001", name: "STATE BANK OF INDIA" },
    { code: "ICIC", ifsc: "ICIC0000002", name: "ICICI BANK LTD" },
    { code: "PUNB", ifsc: "PUNB0000003", name: "PUNJAB NATIONAL BANK" },
    { code: "UTIB", ifsc: "UTIB0000004", name: "AXIS BANK LTD" },
    { code: "BARB", ifsc: "BARB0000005", name: "BANK OF BARODA" },
    { code: "KKBK", ifsc: "KKBK0000006", name: "KOTAK MAHINDRA BANK" },
    { code: "YESB", ifsc: "YESB0000007", name: "YES BANK LTD" },
    { code: "IDFB", ifsc: "IDFB0000008", name: "IDFC FIRST BANK LTD" },
  ];

  const banks = {};
  for (const b of bankDefs) {
    banks[b.code] = await prisma.bank.upsert({
      where: { ifsc: b.ifsc },
      update: { name: b.name, code: b.code },
      create: { name: b.name, ifsc: b.ifsc, code: b.code },
    });
  }
  const bankA = banks["SPCB"];
  const bankB = banks["HDB"];

  // ============================================================================
  // 2. USERS (Preserve 8 core logins + add multi-bank operational staff)
  // ============================================================================
  console.log("[2/25] Seeding Users...");
  const userDefs = [
    // 8 Core Users (Mandatory for existing tests & standard logins)
    { email: "presenting@snb.com", name: "Presenting Bank Clerk", role: "PRESENTING_BANK", bank: "SPCB", branch: "Athwa Lines Branch" },
    { email: "drawee@hdb.com", name: "Drawee Bank Verifier", role: "DRAWEE_BANK", bank: "HDB", branch: "Ring Road Hub" },
    { email: "checker@hdb.com", name: "Drawee Senior Approver (Checker)", role: "DRAWEE_BANK", bank: "HDB", branch: "Ring Road Hub" },
    { email: "admin@MISDESC.com", name: "System Admin", role: "ADMIN", bank: "SPCB", branch: "Central Switch Infrastructure" },
    { email: "manager@snb.com", name: "Rajesh Varma (Branch Manager)", role: "BRANCH_MANAGER", bank: "SPCB", branch: "Athwa Lines Branch" },
    { email: "itops@MISDESC.com", name: "Neha Sharma (Core SRE & IT Staff)", role: "IT_STAFF", bank: "SPCB", branch: "Central Switch Infrastructure" },
    { email: "auditor@rbi.org.in", name: "Vikram Mehta (Compliance Auditor)", role: "COMPLIANCE_AUDITOR", bank: "SPCB", branch: "Regulatory Oversight Wing" },
    { email: "treasury@MISDESC.com", name: "Pooja Hegde (Settlement Officer)", role: "SETTLEMENT_OFFICER", bank: "SPCB", branch: "National Treasury Settlement Desk" },
    // Additional Multi-Bank Users
    { email: "clerk.sbi@MISDESC.com", name: "Amitabh Sen (SBI Outward Clerk)", role: "PRESENTING_BANK", bank: "SBIN", branch: "Nariman Point Main" },
    { email: "checker.sbi@MISDESC.com", name: "Sunita Roy (SBI Senior Approver)", role: "DRAWEE_BANK", bank: "SBIN", branch: "Nariman Point Main" },
    { email: "manager.sbi@MISDESC.com", name: "Dinesh Kulkarni (SBI Branch Head)", role: "BRANCH_MANAGER", bank: "SBIN", branch: "Nariman Point Main" },
    { email: "clerk.icici@MISDESC.com", name: "Rohan Kapoor (ICICI Clearing Clerk)", role: "PRESENTING_BANK", bank: "ICIC", branch: "BKC Clearing Centre" },
    { email: "checker.icici@MISDESC.com", name: "Ananya Iyer (ICICI Inward Checker)", role: "DRAWEE_BANK", bank: "ICIC", branch: "BKC Clearing Centre" },
    { email: "manager.icici@MISDESC.com", name: "Siddharth Nair (ICICI Ops Manager)", role: "BRANCH_MANAGER", bank: "ICIC", branch: "BKC Clearing Centre" },
    { email: "clerk.pnb@MISDESC.com", name: "Harpreet Singh (PNB Clearing Desk)", role: "PRESENTING_BANK", bank: "PUNB", branch: "Connaught Place Hub" },
    { email: "checker.pnb@MISDESC.com", name: "Gurpreet Kaur (PNB Inward Checker)", role: "DRAWEE_BANK", bank: "PUNB", branch: "Connaught Place Hub" },
    { email: "clerk.axis@MISDESC.com", name: "Manish Agarwal (Axis Bank Clerk)", role: "PRESENTING_BANK", bank: "UTIB", branch: "Corporate Clearing Cell" },
    { email: "checker.axis@MISDESC.com", name: "Swati Deshmukh (Axis Checker)", role: "DRAWEE_BANK", bank: "UTIB", branch: "Corporate Clearing Cell" },
    { email: "treasury.hdfc@MISDESC.com", name: "Kunal Mehra (HDFC Treasury Head)", role: "SETTLEMENT_OFFICER", bank: "HDB", branch: "HDFC Treasury Desk" },
    { email: "auditor.npci@npci.org.in", name: "Divya Balan (NPCI Grid Supervisor)", role: "COMPLIANCE_AUDITOR", bank: "SPCB", branch: "NPCI Clearing Oversight" },
  ];

  const users = {};
  for (const u of userDefs) {
    users[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, branchName: u.branch, bankId: banks[u.bank].id },
      create: {
        name: u.name,
        email: u.email,
        password: hash,
        role: u.role,
        branchName: u.branch,
        bankId: banks[u.bank].id,
      },
    });
  }

  // ============================================================================
  // 3. BATCHES (Clearing Sessions across cycles & windows)
  // ============================================================================
  console.log("[3/25] Seeding Batches...");
  const batchDefs = [
    { code: "SESSION-MORNING-01", name: "Standard Morning Clearing Cycle", status: "OPEN", windowType: "STANDARD_CYCLE", cutoff: 60 },
    { code: "SESSION-AFTERNOON-02", name: "Afternoon Express Clearing Cycle", status: "OPEN", windowType: "CONTINUOUS_T0", cutoff: 120 },
    { code: "SESSION-HIGHVALUE-03", name: "High-Value PPS Priority Cycle (> ₹50k)", status: "LOCKED", windowType: "HIGH_VALUE_PPS", cutoff: -30 },
    { code: "SESSION-EVENING-04", name: "Evening Interbank Net Settlement (MNS)", status: "RECONCILED", windowType: "EVENING_SETTLEMENT", cutoff: -180 },
    { code: "SESSION-PREV-T1-01", name: "Previous Day Batch Cycle-01 (T-1)", status: "SETTLED", windowType: "STANDARD_CYCLE", cutoff: -1440 },
    { code: "SESSION-PREV-T1-02", name: "Previous Day Batch Cycle-02 (T-1)", status: "SETTLED", windowType: "STANDARD_CYCLE", cutoff: -1200 },
    { code: "SESSION-WEEKEND-SPL", name: "Weekend Special Commercial Clearing", status: "SETTLED", windowType: "SPECIAL_CLEARING", cutoff: -2880 },
    { code: "SESSION-SWARM-STP", name: "24/7 AI-Swarm Autonomous Clearing Window", status: "OPEN", windowType: "CONTINUOUS_T0", cutoff: 360 },
  ];

  const batches = {};
  const now = new Date();
  for (const b of batchDefs) {
    const cutoffAt = new Date(now.getTime() + b.cutoff * 60 * 1000);
    const reconciledAt = ["RECONCILED", "SETTLED"].includes(b.status) ? new Date(cutoffAt.getTime() + 15 * 60 * 1000) : null;
    const closedAt = b.status === "SETTLED" ? new Date(cutoffAt.getTime() + 30 * 60 * 1000) : null;

    batches[b.code] = await prisma.batch.upsert({
      where: { sessionCode: b.code },
      update: {
        sessionName: b.name,
        status: b.status,
        windowType: b.windowType,
        cutoffAt,
        reconciledAt,
        closedAt,
      },
      create: {
        sessionName: b.name,
        sessionCode: b.code,
        status: b.status,
        windowType: b.windowType,
        cutoffAt,
        reconciledAt,
        closedAt,
        totalCount: 0,
        totalAmount: 0,
        discrepancyCount: 0,
        discrepancyAmount: 0,
        reconciliationReport: {
          matchedCount: 20,
          discrepancyCount: 0,
          verifiedTimestamp: now.toISOString(),
          status: "BALANCED",
        },
      },
    });
  }

  // ============================================================================
  // 4. POSITIVE PAY RECORDS (Pre-registered drawer instruments)
  // ============================================================================
  console.log("[4/25] Seeding Positive Pay Records...");
  const ppsRecordsData = [
    { acc: "123456789012", chq: "000123", payee: "Surat Diamond Exports Ltd", amt: 50000, bank: "HDB", status: "MATCHED" },
    { acc: "987654321098", chq: "450122", payee: "Acme Industrial Corp", amt: 150000, bank: "HDB", status: "MATCHED" },
    { acc: "555666777888", chq: "998877", payee: "Delta Logistics LLP", amt: 75000, bank: "HDB", status: "DISCREPANT" },
    { acc: "112233445566", chq: "000101", payee: "Larsen & Toubro Ltd", amt: 450000, bank: "SBIN", status: "REGISTERED" },
    { acc: "223344556677", chq: "000102", payee: "Reliance Retail Ventures", amt: 1250000, bank: "ICIC", status: "MATCHED" },
    { acc: "334455667788", chq: "000103", payee: "Tata Consultancy Services", amt: 850000, bank: "UTIB", status: "REGISTERED" },
    { acc: "445566778899", chq: "000104", payee: "Infosys BPO Solutions", amt: 320000, bank: "PUNB", status: "MATCHED" },
    { acc: "556677889900", chq: "000105", payee: "Shree Ram Textiles Surat", amt: 95000, bank: "SPCB", status: "MATCHED" },
    { acc: "667788990011", chq: "000106", payee: "Mahindra Heavy Industries", amt: 2100000, bank: "BARB", status: "REGISTERED" },
    { acc: "778899001122", chq: "000107", payee: "Adani Solar Power Ltd", amt: 4500000, bank: "KKBK", status: "MATCHED" },
    { acc: "889900112233", chq: "000108", payee: "Zomato Supply Chain", amt: 180000, bank: "YESB", status: "REGISTERED" },
    { acc: "990011223344", chq: "000109", payee: "Delta Healthcare Diagnostics", amt: 64000, bank: "IDFB", status: "MATCHED" },
    { acc: "101112131415", chq: "000110", payee: "Gujarat State Fertilizers", amt: 780000, bank: "SPCB", status: "REGISTERED" },
    { acc: "202122232425", chq: "000111", payee: "Bharat Petroleum Refineries", amt: 3600000, bank: "SBIN", status: "MATCHED" },
    { acc: "303132333435", chq: "000112", payee: "Asian Paints Depot", amt: 240000, bank: "HDB", status: "REGISTERED" },
    { acc: "404142434445", chq: "000113", payee: "UltraTech Cement Corp", amt: 1850000, bank: "ICIC", status: "MATCHED" },
    { acc: "505152535455", chq: "000114", payee: "Wipro Digital Infrastructure", amt: 520000, bank: "UTIB", status: "REGISTERED" },
    { acc: "606162636465", chq: "000115", payee: "Godrej Consumer Products", amt: 110000, bank: "PUNB", status: "MATCHED" },
    { acc: "707172737475", chq: "000116", payee: "Sun Pharma Laboratories", amt: 990000, bank: "BARB", status: "REGISTERED" },
    { acc: "808182838485", chq: "000117", payee: "Bajaj Auto Distribution", amt: 1450000, bank: "KKBK", status: "MATCHED" },
    { acc: "909192939495", chq: "000118", payee: "Hindustan Unilever Ltd", amt: 275000, bank: "YESB", status: "REGISTERED" },
    { acc: "121314151617", chq: "000119", payee: "Havells Electrical Goods", amt: 82000, bank: "IDFB", status: "MATCHED" },
    { acc: "232425262728", chq: "000120", payee: "Pidilite Industries Fevicol", amt: 135000, bank: "SPCB", status: "REGISTERED" },
    { acc: "343536373839", chq: "000121", payee: "Titan Watches & Jewelry", amt: 620000, bank: "SBIN", status: "MATCHED" },
    { acc: "454647484950", chq: "000122", payee: "MRF Tyres & Rubber Ltd", amt: 890000, bank: "HDB", status: "REGISTERED" },
  ];

  for (const p of ppsRecordsData) {
    await prisma.positivePayRecord.upsert({
      where: {
        accountNumber_chequeNumber: {
          accountNumber: p.acc,
          chequeNumber: p.chq,
        },
      },
      update: {
        payeeName: p.payee,
        amount: p.amt,
        chequeDate: new Date(),
        status: p.status,
      },
      create: {
        accountNumber: p.acc,
        chequeNumber: p.chq,
        payeeName: p.payee,
        amount: p.amt,
        chequeDate: new Date(),
        status: p.status,
        bankId: banks[p.bank].id,
      },
    });
  }

  // ============================================================================
  // 5. INTRADAY LIQUIDITY POOLS (All 10 Banks)
  // ============================================================================
  console.log("[5/25] Seeding Liquidity Pools...");
  const poolConfigs = [
    { bank: "SPCB", collateral: 25000000.0, credit: 5000000.0, exposure: 350000.0, reserved: 150000.0, status: "HEALTHY" },
    { bank: "HDB",  collateral: 50000000.0, credit: 15000000.0, exposure: 1250000.0, reserved: 450000.0, status: "HEALTHY" },
    { bank: "SBIN", collateral: 100000000.0, credit: 30000000.0, exposure: 4500000.0, reserved: 1200000.0, status: "HEALTHY" },
    { bank: "ICIC", collateral: 60000000.0, credit: 20000000.0, exposure: 2100000.0, reserved: 800000.0, status: "HEALTHY" },
    { bank: "PUNB", collateral: 40000000.0, credit: 10000000.0, exposure: 32000000.0, reserved: 5000000.0, status: "WARNING" },
    { bank: "UTIB", collateral: 45000000.0, credit: 12000000.0, exposure: 950000.0, reserved: 300000.0, status: "HEALTHY" },
    { bank: "BARB", collateral: 35000000.0, credit: 8000000.0, exposure: 1400000.0, reserved: 400000.0, status: "HEALTHY" },
    { bank: "KKBK", collateral: 30000000.0, credit: 7000000.0, exposure: 800000.0, reserved: 250000.0, status: "HEALTHY" },
    { bank: "YESB", collateral: 20000000.0, credit: 4000000.0, exposure: 19500000.0, reserved: 3500000.0, status: "BREACHED" },
    { bank: "IDFB", collateral: 25000000.0, credit: 6000000.0, exposure: 600000.0, reserved: 200000.0, status: "HEALTHY" },
  ];

  const pools = {};
  for (const pc of poolConfigs) {
    const bankId = banks[pc.bank].id;
    pools[pc.bank] = await prisma.liquidityPool.upsert({
      where: { bankId },
      update: {
        allocatedCollateral: pc.collateral,
        creditLine: pc.credit,
        currentExposure: pc.exposure,
        reservedAmount: pc.reserved,
        status: pc.status,
      },
      create: {
        bankId,
        allocatedCollateral: pc.collateral,
        creditLine: pc.credit,
        currentExposure: pc.exposure,
        reservedAmount: pc.reserved,
        status: pc.status,
      },
    });
  }

  // ============================================================================
  // 6. LIQUIDITY EVENTS (Pool telemetry & stress history)
  // ============================================================================
  console.log("[6/25] Seeding Liquidity Events...");
  const poolKeys = Object.keys(pools);
  for (let i = 0; i < poolKeys.length; i++) {
    const pool = pools[poolKeys[i]];
    const eventTypes = ["COLLATERAL_DEPOSIT", "EXPOSURE_INCREASE", "EXPOSURE_RELEASE", "SETTLEMENT_SETTLE", "LIMIT_BREACH"];
    for (let j = 0; j < 3; j++) {
      const evType = eventTypes[(i + j) % eventTypes.length];
      await prisma.liquidityEvent.create({
        data: {
          poolId: pool.id,
          eventType: evType,
          amount: (j + 1) * 250000.0,
          utilizationPercentAfter: 20.0 + (i * 6.5) + (j * 4.2),
          referenceId: `LIQ-TXN-${Date.now().toString().slice(-6)}-${i}${j}`,
          remarks: `Automated intraday liquidity reservation audit for ${poolKeys[i]} under Cycle ${j + 1}`,
          createdAt: new Date(now.getTime() - (3 - j) * 3600 * 1000),
        },
      });
    }
  }

  // ============================================================================
  // 7. DIGITAL CERTIFICATES (PKI X.509 RSA-4096 / ECDSA Signers)
  // ============================================================================
  console.log("[7/25] Seeding Digital Certificates...");
  const certThumbprints = [
    { bank: "SPCB", thumb: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0", serial: "MISDESC-PKI-SPCB-2026-001" },
    { bank: "HDB",  thumb: "f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef1", serial: "MISDESC-PKI-HDB-2026-002" },
    { bank: "SBIN", thumb: "b2c3d4e5f6a10718293a4b5c6d7e8f90123456789abcdef0123456789abcdef2", serial: "MISDESC-PKI-SBIN-2026-003" },
    { bank: "ICIC", thumb: "c3d4e5f6a1b20718293a4b5c6d7e8f90123456789abcdef0123456789abcdef3", serial: "MISDESC-PKI-ICIC-2026-004" },
    { bank: "PUNB", thumb: "d4e5f6a1b2c30718293a4b5c6d7e8f90123456789abcdef0123456789abcdef4", serial: "MISDESC-PKI-PUNB-2026-005" },
    { bank: "UTIB", thumb: "e5f6a1b2c3d40718293a4b5c6d7e8f90123456789abcdef0123456789abcdef5", serial: "MISDESC-PKI-UTIB-2026-006" },
  ];

  const certificates = {};
  for (const c of certThumbprints) {
    certificates[c.bank] = await prisma.digitalCertificate.upsert({
      where: { certThumbprint: c.thumb },
      update: { status: "ACTIVE" },
      create: {
        bankId: banks[c.bank].id,
        certThumbprint: c.thumb,
        serialNumber: c.serial,
        issuer: "MISDESC National PKI Root Trust CA",
        subject: `CN=${banks[c.bank].name} Presentation Signer, OU=Digital Clearing, O=${banks[c.bank].name}, C=IN`,
        validFrom: new Date(),
        validTo: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
        keyAlgorithm: "RSA-4096 / SHA-256",
      },
    });
  }

  // ============================================================================
  // 8. BATCH SIGNATURE AUDITS (PKI manifests on batches)
  // ============================================================================
  console.log("[8/25] Seeding Batch Signature Audits...");
  const batchKeys = Object.keys(batches);
  for (let i = 0; i < 4; i++) {
    const batch = batches[batchKeys[i]];
    const cert = certificates["SPCB"] || Object.values(certificates)[0];
    await prisma.batchSignatureAudit.create({
      data: {
        batchId: batch.id,
        certificateId: cert.id,
        signatureDigest: sha256(`BATCH-SIG-${batch.sessionCode}-${i}`),
        payloadDigest: sha256(`PAYLOAD-${batch.sessionCode}`),
        verified: true,
        verificationNotes: "Cryptographic X.509 signature verified successfully against MISDESC Root Trust Chain",
      },
    });
  }

  // ============================================================================
  // 9. CHEQUES (65 Realistic Bulk Instruments Across All States & Tiers)
  // ============================================================================
  console.log("[9/25] Seeding Cheques (Bulk Instruments)...");
  const samplePayees = [
    "Surat Diamond Exports Ltd",
    "Acme Industrial Corp",
    "Larsen & Toubro Heavy Engg",
    "Reliance Retail Ventures",
    "Tata Consultancy Services",
    "Infosys BPO Solutions",
    "Shree Ram Textiles Surat",
    "Mahindra Auto Components",
    "Adani Power Transmission",
    "Zomato Supply Chain Pvt Ltd",
    "Delta Pharma Laboratories",
    "Gujarat State Fertilizers Corp",
    "Bharat Petroleum Refineries",
    "Asian Paints Regional Depot",
    "UltraTech Cement Logistics",
    "Wipro Digital Infrastructure",
    "Godrej Consumer Products",
    "Sun Pharma Active Ingredients",
    "Bajaj Auto Commercial Distribution",
    "Hindustan Unilever Distribution",
    "Havells Electrical Switchgears",
    "Pidilite Industries Ltd",
    "Titan Watches & Jewelry",
    "MRF Tyres & Rubber Dist.",
    "Swastik Texturizing Mills Surat",
  ];

  const returnReasons = [
    "01 - Funds Insufficient (Exceeds Arrangement)",
    "02 - Signature Differs / Specimen Missing",
    "03 - Cheque Altered Without Drawer Confirmation",
    "04 - Positive Pay Mandatory Discrepancy",
    "05 - Stale / Outdated Instrument (> 90 Days)",
    "06 - Account Blocked by Statutory Court Attachment",
    "07 - Duplicate Instrument Presented in Clearing",
  ];

  const imageFiles = ["/sample-cheque.jpg", "/cheque-000102.jpg", "/cheque-000123.jpg"];
  const statuses = [
    "PRESENTED", "PRESENTED", "PRESENTED",
    "VERIFIED", "VERIFIED", "VERIFIED",
    "AWAITING_CHECKER", "AWAITING_CHECKER",
    "CLEARED", "CLEARED", "CLEARED", "CLEARED",
    "RETURNED",
  ];

  const bankCodes = Object.keys(banks);
  const createdCheques = [];

  for (let i = 1; i <= 65; i++) {
    const chqNum = String(100 + i).padStart(6, "0");
    const micr = `3950660${String(10 + (i % 80)).padStart(2, "0")}`;
    const acc = `10203040${String(1000 + i)}`;
    const status = statuses[i % statuses.length];
    const presBankKey = bankCodes[i % bankCodes.length];
    const drawBankKey = bankCodes[(i + 1) % bankCodes.length];
    const batchKey = batchKeys[i % batchKeys.length];

    // Amounts spread from retail ₹15,000 to enterprise ₹65,00,000
    let amount = 15000 + (i * 32000);
    if (i % 5 === 0) amount = 550000 + (i * 45000); // High-value PPS
    if (i % 12 === 0) amount = 2500000 + (i * 120000); // Enterprise Tier

    const riskTier = amount > 1000000 || status === "RETURNED" ? "HIGH" : amount > 200000 ? "MEDIUM" : "LOW";
    const riskScore = riskTier === "HIGH" ? 78.5 + (i % 15) : riskTier === "MEDIUM" ? 42.0 + (i % 25) : 12.0 + (i % 18);
    const ppsStatus = amount >= 50000 ? (status === "RETURNED" ? "PPS_DISCREPANCY" : "PPS_VERIFIED") : "PPS_NOT_REQUIRED";
    const sigScore = status === "RETURNED" && i % 2 === 0 ? 46.2 : 94.5 + ((i % 5) * 1.0);
    const returnReason = status === "RETURNED" ? returnReasons[i % returnReasons.length] : null;

    const cheque = await prisma.cheque.create({
      data: {
        chequeNumber: chqNum,
        micrCode: micr,
        accountNumber: acc,
        ifsc: banks[drawBankKey].ifsc,
        amount: amount,
        payeeName: samplePayees[i % samplePayees.length],
        imageUrl: imageFiles[i % imageFiles.length],
        imageHash: sha256(`CHEQUE-IMG-${chqNum}-${amount}`),
        status: status,
        returnReason: returnReason,
        riskScore: riskScore,
        riskTier: riskTier,
        riskFactors: riskTier !== "LOW" ? ["High value transaction", "First-time payee account", "Intercity presentation"] : [],
        ppsStatus: ppsStatus,
        ppsDiscrepancy: ppsStatus === "PPS_DISCREPANCY" ? { field: "payeeName", registered: "Delta Logistics", presented: samplePayees[i % samplePayees.length] } : null,
        signatureMatchScore: sigScore,
        signatureStatus: sigScore > 85 ? "VERIFIED" : "FLAGGED",
        makerId: users["presenting@snb.com"]?.id,
        checkerId: ["CLEARED", "AWAITING_CHECKER"].includes(status) ? users["checker@hdb.com"]?.id : null,
        ekuberUtr: status === "CLEARED" ? `EKUBER-20261016-UTR-${String(800000 + i)}` : null,
        ekuberRef: status === "CLEARED" ? `EKUBER-REF-${String(90000 + i)}` : null,
        settledAt: status === "CLEARED" ? new Date(now.getTime() - (i * 20) * 60 * 1000) : null,
        settlementMode: status === "CLEARED" ? (i % 3 === 0 ? "CONTINUOUS_T0" : "NET_BATCH_MNS") : "CONTINUOUS_T0",
        beneficiaryCreditStatus: status === "CLEARED" ? "CREDITED" : "PENDING",
        batchId: batches[batchKey].id,
        branchName: i % 2 === 0 ? "Athwa Lines Branch" : "Ring Road Textile Hub",
        branchManagerApproved: true,
        presentingBankId: banks[presBankKey].id,
        draweeBankId: banks[drawBankKey].id,
        uploadedById: users["presenting@snb.com"]?.id || Object.values(users)[0].id,
        liquidityReservationRef: `RES-LIQ-${String(50000 + i)}`,
        createdAt: new Date(now.getTime() - (65 - i) * 18 * 60 * 1000),
      },
    });
    createdCheques.push(cheque);
  }

  // Update Batch Totals
  for (const b of Object.values(batches)) {
    const chqs = await prisma.cheque.findMany({ where: { batchId: b.id } });
    const totalAmt = chqs.reduce((acc, c) => acc + Number(c.amount), 0);
    await prisma.batch.update({
      where: { id: b.id },
      data: {
        totalCount: chqs.length,
        totalAmount: totalAmt,
      },
    });
  }

  // ============================================================================
  // 10. FRAUD FLAGS (Enterprise AI Anomaly Detection)
  // ============================================================================
  console.log("[10/25] Seeding Fraud Flags...");
  const flagTypes = ["HIGH_VALUE", "VELOCITY", "DUPLICATE_IMAGE", "ANOMALOUS_AMOUNT", "DUPLICATE_CHEQUE_NUMBER"];
  const severities = ["LOW", "MEDIUM", "HIGH"];

  for (let i = 0; i < 28; i++) {
    const chq = createdCheques[i * 2 % createdCheques.length];
    const fType = flagTypes[i % flagTypes.length];
    const sev = chq.riskTier === "HIGH" ? "HIGH" : severities[i % severities.length];
    const isResolved = i % 3 === 0;

    await prisma.fraudFlag.create({
      data: {
        chequeId: chq.id,
        type: fType,
        severity: sev,
        details: `Automated Forensic Rule Engine Alert: ${fType} detected on instrument #${chq.chequeNumber}. Score: ${chq.riskScore}`,
        resolved: isResolved,
        resolvedBy: isResolved ? "admin@MISDESC.com" : null,
        createdAt: new Date(chq.createdAt.getTime() + 2 * 60 * 1000),
      },
    });
  }

  // ============================================================================
  // 11. CLEARING EVENTS (Cryptographic Audit Trail with Ledger Hashing)
  // ============================================================================
  console.log("[11/25] Seeding Clearing Events...");
  let previousHash = "0000000000000000000000000000000000000000000000000000000000000000";

  for (let i = 0; i < createdCheques.length; i++) {
    const chq = createdCheques[i];

    // Event 1: Presentation
    const ev1Hash = sha256({ id: chq.id, toStatus: "PRESENTED", prevHash: previousHash, ts: chq.createdAt });
    await prisma.clearingEvent.create({
      data: {
        chequeId: chq.id,
        fromStatus: null,
        toStatus: "PRESENTED",
        remarks: "Instrument scanned and captured via UV/MICR flatbed scanner at branch counter",
        hash: ev1Hash,
        prevHash: previousHash,
        actorId: users["presenting@snb.com"]?.id,
        createdAt: chq.createdAt,
      },
    });
    previousHash = ev1Hash;

    // Event 2: Verification
    if (["VERIFIED", "AWAITING_CHECKER", "CLEARED", "RETURNED"].includes(chq.status)) {
      const ev2Time = new Date(chq.createdAt.getTime() + 10 * 60 * 1000);
      const ev2Hash = sha256({ id: chq.id, toStatus: "VERIFIED", prevHash: previousHash, ts: ev2Time });
      await prisma.clearingEvent.create({
        data: {
          chequeId: chq.id,
          fromStatus: "PRESENTED",
          toStatus: "VERIFIED",
          remarks: "OCR MICR checksum matched; Drawee positive pay database validated",
          hash: ev2Hash,
          prevHash: previousHash,
          actorId: users["drawee@hdb.com"]?.id,
          createdAt: ev2Time,
        },
      });
      previousHash = ev2Hash;
    }

    // Event 3: Final State
    if (["CLEARED", "RETURNED", "AWAITING_CHECKER"].includes(chq.status)) {
      const ev3Time = new Date(chq.createdAt.getTime() + 25 * 60 * 1000);
      const ev3Hash = sha256({ id: chq.id, toStatus: chq.status, prevHash: previousHash, ts: ev3Time });
      await prisma.clearingEvent.create({
        data: {
          chequeId: chq.id,
          fromStatus: "VERIFIED",
          toStatus: chq.status,
          remarks: chq.status === "CLEARED"
            ? "Maker-Checker dual authorization complete. Settled via RBI e-Kuber MNS Gateway."
            : chq.status === "RETURNED"
            ? `Instrument dishonoured: ${chq.returnReason}. Statutory dishonour memo issued.`
            : "High-value dual-control hold: awaiting Senior Approver (Checker) sign-off.",
          hash: ev3Hash,
          prevHash: previousHash,
          actorId: users["checker@hdb.com"]?.id,
          createdAt: ev3Time,
        },
      });
      previousHash = ev3Hash;
    }
  }

  // ============================================================================
  // 12. SETTLEMENTS (Multilateral & Bilateral Net Positions)
  // ============================================================================
  console.log("[12/25] Seeding Settlements...");
  for (let i = 0; i < 22; i++) {
    const bankAId = banks[bankCodes[i % bankCodes.length]].id;
    const bankBId = banks[bankCodes[(i + 2) % bankCodes.length]].id;
    const netAmt = 1500000.0 + (i * 350000.0);
    const dir = i % 2 === 0 ? "A_TO_B" : "B_TO_A";

    await prisma.settlement.create({
      data: {
        cycleDate: new Date(now.getTime() - (i * 8) * 3600 * 1000),
        bankAId,
        bankBId,
        netAmount: netAmt,
        direction: dir,
        createdAt: new Date(now.getTime() - (i * 8) * 3600 * 1000),
      },
    });
  }

  // ============================================================================
  // 13. TELEMETRY EVENTS (System SRE & APM Logs)
  // ============================================================================
  console.log("[13/25] Seeding Telemetry Events...");
  const telemetryLogs = [
    { src: "backend", lvl: "info", msg: "LSM cycle solver resolved 4-bank circular gridlock in 14.2ms. Released ₹1.82 Cr." },
    { src: "backend", lvl: "info", msg: "Tarjan strongly connected components solver identified 3 circular debt loops." },
    { src: "backend", lvl: "info", msg: "NIST FIPS 204 ML-DSA-65 post-quantum hybrid certificate verification PASSED." },
    { src: "backend", lvl: "info", msg: "zk-SNARK Groth16 confidential solvency proof generated in 24.1ms on BN254." },
    { src: "backend", lvl: "warn", lvlNum: 2, msg: "Liquidity buffer alert: YES BANK LTD exposure reached 97.5% of credit ceiling." },
    { src: "backend", lvl: "error", msg: "Core banking CBS webhook timeout on endpoint https://cbs-gw.punb.co.in/notify (retrying in 5s)." },
    { src: "frontend", lvl: "info", msg: "High-resolution UV/IR canvas viewer loaded in 120ms with 3 bounding boxes." },
    { src: "frontend", lvl: "warn", msg: "Client latency warning: slow network response on /api/analytics/gridlock (450ms)." },
    { src: "backend", lvl: "info", msg: "Autonomous 4-Agent Swarm achieved 98.4% consensus on Cheque #000105. Auto-cleared STP." },
    { src: "backend", lvl: "info", msg: "Cross-border sanctions radar screened 12 international wire memos against OFAC/UN lists in 28ms." },
    { src: "backend", lvl: "info", msg: "RBI e-Kuber MNS Continuous T+0 Gateway synchronized RTGS batches." },
    { src: "backend", lvl: "warn", msg: "Discrepancy detected in PPS High-Value batch SESSION-HIGHVALUE-03 for 1 instrument." },
    { src: "backend", lvl: "info", msg: "Cryptographic micro-lien escrow #CBS-LOCK-2026-4401 earmarked ₹12.5L on drawer funds." },
    { src: "frontend", lvl: "info", msg: "WebSocket SSE channel connected for user manager@snb.com on Athwa Lines Branch." },
    { src: "backend", lvl: "info", msg: "Statutory RBI Form VI Dishonour Memo register compiled for 7 instruments." },
  ];

  for (let i = 0; i < 30; i++) {
    const t = telemetryLogs[i % telemetryLogs.length];
    await prisma.telemetryEvent.create({
      data: {
        source: t.src,
        level: t.lvl,
        message: t.msg,
        url: t.src === "frontend" ? "http://localhost:8080/dashboard" : "/api/clearing/process",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MISDESC-Switch-Gateway/2.0",
        context: { cycle: i + 1, latencyMs: 12 + (i * 3) },
        createdAt: new Date(now.getTime() - (30 - i) * 15 * 60 * 1000),
      },
    });
  }

  // ============================================================================
  // 14. DISPUTE CLAIMS & AUDIT LOGS (NPCI DRM Dispute Resolution Engine)
  // ============================================================================
  console.log("[14/25] Seeding Dispute Claims & Audit Logs...");
  const disputeTypes = [
    "UNAUTHORIZED_DEBIT",
    "AMOUNT_MISMATCH",
    "DUPLICATE_PRESENTATION",
    "LATE_RETURN",
    "FORGED_SIGNATURE",
    "PPS_BREACH",
  ];
  const disputeStatuses = [
    "FILED",
    "UNDER_REVIEW",
    "EVIDENCE_REQUESTED",
    "RESOLVED_CLAIMANT",
    "RESOLVED_RESPONDENT",
    "ESCALATED_RBI_OMBUDSMAN",
    "CLOSED",
  ];

  for (let i = 0; i < 18; i++) {
    const chq = createdCheques[i * 3 % createdCheques.length];
    const claimNum = `DRM-2026-${String(1001 + i)}`;
    const dType = disputeTypes[i % disputeTypes.length];
    const dStatus = disputeStatuses[i % disputeStatuses.length];
    const initBank = chq.presentingBankId;
    const respBank = chq.draweeBankId;

    const dispute = await prisma.disputeClaim.upsert({
      where: { claimNumber: claimNum },
      update: { status: dStatus },
      create: {
        claimNumber: claimNum,
        chequeId: chq.id,
        initiatingBankId: initBank,
        respondentBankId: respBank,
        disputeType: dType,
        claimAmount: chq.amount,
        status: dStatus,
        filedById: users["manager@snb.com"]?.id || Object.values(users)[0].id,
        resolvedById: ["RESOLVED_CLAIMANT", "RESOLVED_RESPONDENT", "CLOSED"].includes(dStatus) ? users["auditor@rbi.org.in"]?.id : null,
        evidenceNotes: `DRM Dispute raised for ${dType} on Cheque #${chq.chequeNumber}. Evidence documents attached with UV signature scan.`,
        resolutionSummary: ["RESOLVED_CLAIMANT", "RESOLVED_RESPONDENT"].includes(dStatus)
          ? "Case investigated under NPCI DRM Guidelines. Evidence verified and adjustment voucher credited."
          : null,
        slaDeadline: new Date(now.getTime() + (7 - (i % 5)) * 24 * 3600 * 1000),
        createdAt: new Date(now.getTime() - (18 - i) * 6 * 3600 * 1000),
      },
    });

    // Dispute Audit Logs
    await prisma.disputeAuditLog.create({
      data: {
        disputeId: dispute.id,
        actorId: users["manager@snb.com"]?.id,
        fromStatus: null,
        toStatus: "FILED",
        actionNotes: "Formal DRM dispute claim registered on clearing portal",
        createdAt: dispute.createdAt,
      },
    });

    if (dStatus !== "FILED") {
      await prisma.disputeAuditLog.create({
        data: {
          disputeId: dispute.id,
          actorId: users["auditor@rbi.org.in"]?.id,
          fromStatus: "FILED",
          toStatus: dStatus,
          actionNotes: `Dispute review transitioned to ${dStatus} following interbank response submission`,
          createdAt: new Date(dispute.createdAt.getTime() + 4 * 3600 * 1000),
        },
      });
    }
  }

  // ============================================================================
  // 15. SMART CHEQUE CONTRACTS & ESCROW MILESTONES (Programmable CBDC)
  // ============================================================================
  console.log("[15/25] Seeding Smart Cheques & Escrow Milestones...");
  for (let i = 0; i < 15; i++) {
    const chq = createdCheques[i * 4];
    const contractId = `SMART-CHQ-2026-${String(4001 + i)}`;
    const totalAmt = Number(chq.amount);
    const taxRate = 18.0;
    const taxAmt = Math.round(totalAmt * (taxRate / (100 + taxRate)));
    const netAmt = totalAmt - taxAmt;
    const isSatisfied = i % 2 === 0;

    const contract = await prisma.smartChequeContract.upsert({
      where: { contractId },
      update: {
        programmableState: isSatisfied ? "SATISFIED" : "ACTIVE",
        cbdcSettled: isSatisfied,
      },
      create: {
        contractId,
        chequeId: chq.id,
        totalAmount: totalAmt,
        taxRatePercent: taxRate,
        taxDeductedAmount: taxAmt,
        netVendorAmount: netAmt,
        taxAuthority: "GSTN / CBDT Directorate of Income Tax",
        taxChallanRef: `GSTN-CHAL-2026-0${100 + i}`,
        programmableState: isSatisfied ? "SATISFIED" : "ACTIVE",
        cbdcSettled: isSatisfied,
        cbdcReceipt: isSatisfied ? {
          digitalTokenId: `e₹-MINT-NODE-01-${String(900000 + i)}`,
          reserveBankMintRef: "RBI-CBDC-W-MINT-2026-A1",
          timestamp: now.toISOString(),
          status: "ATOMIC_CBDC_SETTLEMENT_COMMITTED",
        } : null,
      },
    });

    // 2-3 Escrow Milestones per contract
    const milestones = [
      { step: "M1_PRESENTATION_CLEARANCE", name: "CTS Clearing House Verification", pct: 40.0, status: "SATISFIED" },
      { step: "M2_DELIVERY_SIGN_OFF", name: "IoT Goods Inward Delivery Sign-off", pct: 40.0, status: isSatisfied ? "SATISFIED" : "PENDING_IOT_CONFIRMATION" },
      { step: "M3_FINAL_COMMISSIONING", name: "Quality Assurance Final Sign-off", pct: 20.0, status: isSatisfied ? "SATISFIED" : "PENDING" },
    ];

    for (const m of milestones) {
      const mAmt = Math.round(totalAmt * (m.pct / 100));
      await prisma.escrowMilestone.create({
        data: {
          contractId: contract.id,
          stepId: m.step,
          name: m.name,
          payoutPercent: m.pct,
          amount: mAmt,
          status: m.status,
          releasedAt: m.status === "SATISFIED" ? new Date(now.getTime() - 2 * 3600 * 1000) : null,
        },
      });
    }
  }

  // ============================================================================
  // 16. MICRO-LIENS (CBS Earmarking & 0% Bounce Risk Guarantee)
  // ============================================================================
  console.log("[16/25] Seeding Micro-Liens...");
  for (let i = 0; i < 15; i++) {
    const chq = createdCheques[i * 4 + 1];
    const lienId = `LIEN-ESCROW-2026-${String(7001 + i)}`;

    await prisma.microLien.upsert({
      where: { lienId },
      update: { status: "LOCKED_IN_ESCROW" },
      create: {
        lienId,
        chequeId: chq.id,
        drawerAccount: chq.accountNumber,
        earmarkedAmount: chq.amount,
        status: "LOCKED_IN_ESCROW",
        bounceRisk: "0.0%",
        cbsLockReference: `CBS-HOLD-FINACLE-${String(88000 + i)}`,
        holdExpiry: new Date(now.getTime() + 72 * 3600 * 1000),
      },
    });
  }

  // ============================================================================
  // 17. ZK-PROOF RECORDS (zk-SNARK Groth16 / BN254 Confidential Clearing)
  // ============================================================================
  console.log("[17/25] Seeding zk-SNARK Groth16 Proofs...");
  for (let i = 0; i < 16; i++) {
    const chq = createdCheques[i * 3];
    const proofId = `ZK-GROTH16-BN254-${String(5001 + i)}`;

    await prisma.zkProofRecord.upsert({
      where: { proofId },
      update: { verified: true },
      create: {
        proofId,
        chequeId: chq.id,
        protocol: "Groth16",
        curve: "BN254",
        provingTimeMs: 19.4 + (i * 0.8),
        publicSignals: {
          drawerBalanceHash: sha256(`BAL-${chq.accountNumber}`),
          solvencyThresholdGte: Number(chq.amount),
          zeroDataLeakage: true,
        },
        proofPiA: [
          "0x1f2e3d4c5b6a708192a3b4c5d6e7f809123456789abcdef0123456789abcdef0",
          "0x0fedcba9876543210fedcba9876543210fedcba9876543210fedcba987654321",
        ],
        proofPiB: [
          [
            "0x2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f70819",
            "0x3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a",
          ],
          [
            "0x4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b",
            "0x5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c",
          ],
        ],
        proofPiC: [
          "0x6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d",
          "0x7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e",
        ],
        verified: true,
        pairingEquation: "e(A, B) = e(alpha, beta) * e(x, gamma) * e(C, delta)",
      },
    });
  }

  // ============================================================================
  // 18. PQC MANIFESTS (NIST FIPS 204 ML-DSA Dilithium / ML-KEM)
  // ============================================================================
  console.log("[18/25] Seeding NIST PQC Manifests...");
  for (let i = 0; i < batchKeys.length; i++) {
    const batch = batches[batchKeys[i]];
    const manifestId = `PQC-MANIFEST-2026-${String(8001 + i)}`;

    await prisma.pqcManifest.upsert({
      where: { manifestId },
      update: { latticeVerified: true },
      create: {
        manifestId,
        batchId: batch.id,
        bankCode: "SPCB",
        algorithm: "ML-DSA-65 (FIPS 204)",
        classicalDigest: sha256(`CLASSICAL-${batch.sessionCode}`),
        pqcDigest: sha256(`PQC-DILITHIUM-${batch.sessionCode}`),
        dualLayerSignature: {
          classicalSha384Rsa: sha256(`RSA-${batch.sessionCode}`),
          postQuantumDilithiumZ: sha256(`LATTICE-Z-${batch.sessionCode}`),
          normBoundVerified: true,
        },
        latticeNormBound: 218.45 + (i * 3.2),
        latticeVerified: true,
        kemEncapsulation: {
          kemAlgorithm: "ML-KEM-768 (FIPS 203)",
          sharedKeyDigest: sha256(`KEM-SHARED-${batch.sessionCode}`),
        },
      },
    });
  }

  // ============================================================================
  // 19. SWARM DOCKETS (Autonomous 4-Agent Multi-Agent Adjudication)
  // ============================================================================
  console.log("[19/25] Seeding 4-Agent Swarm Dockets...");
  for (let i = 0; i < 18; i++) {
    const chq = createdCheques[i * 3 + 2];
    const docketId = `SWARM-DOCKET-2026-${String(3001 + i)}`;
    const isStp = chq.riskTier === "LOW" && chq.status !== "RETURNED";
    const consensusScore = isStp ? 96.5 + (i % 3) : 68.0 + (i % 15);

    await prisma.swarmDocket.upsert({
      where: { docketId },
      update: { consensusScore, stpExecuted: isStp },
      create: {
        docketId,
        chequeId: chq.id,
        consensusScore: consensusScore,
        verdict: isStp ? "STP_CLEARED_AUTONOMOUS" : "ESCALATED_HUMAN_REVIEW",
        stpExecuted: isStp,
        durationMs: 125.0 + (i * 4.5),
        sealedProof: sha256(`SWARM-SEAL-${docketId}-${chq.id}`),
        agentResults: [
          { agent: "MICR_INTEGRITY_AGENT", confidence: 99.1, status: "PASS", anomalyCount: 0 },
          { agent: "FORENSIC_FORGERY_AGENT", confidence: isStp ? 98.4 : 64.2, status: isStp ? "PASS" : "FLAG", anomalyCount: isStp ? 0 : 2 },
          { agent: "BEHAVIORAL_VELOCITY_AGENT", confidence: 97.2, status: "PASS", anomalyCount: 0 },
          { agent: "POSITIVE_PAY_VERIFIER_AGENT", confidence: chq.ppsStatus === "PPS_VERIFIED" ? 99.9 : 85.0, status: "PASS" },
        ],
        criticalFlags: isStp ? [] : ["Signature specimen confidence < 75%", "Amount velocity check triggered"],
      },
    });
  }

  // ============================================================================
  // 20. SANCTIONS LOGS (Cross-Border Watchlist Screening Radar)
  // ============================================================================
  console.log("[20/25] Seeding Sanctions Screening Logs...");
  const sanctionScenarios = [
    { drawer: "Surat Diamond Exports Ltd", payee: "Al-Faisal Logistics Corp", country: "AE", verdict: "SANCTIONS_BLOCKED_OFAC_VIOLATION", isBlocked: true, isFlagged: true },
    { drawer: "Acme Industrial Corp", payee: "Vanguard Shadow Trade LLC", country: "SG", verdict: "SANCTIONS_BLOCKED_OFAC_VIOLATION", isBlocked: true, isFlagged: true },
    { drawer: "Alexander Petrovich Global", payee: "Reliance Retail Ventures", country: "RU", verdict: "PEP_ENHANCED_DILIGENCE_REQUIRED", isBlocked: false, isFlagged: true },
    { drawer: "Tata Consultancy Services", payee: "London Clearing Financial", country: "GB", verdict: "CLEARED_INTERNATIONAL_CLEARING", isBlocked: false, isFlagged: false },
    { drawer: "Infosys BPO Solutions", payee: "New York Technology Ventures", country: "US", verdict: "CLEARED_INTERNATIONAL_CLEARING", isBlocked: false, isFlagged: false },
    { drawer: "Shree Ram Textiles", payee: "Dubai Textile Traders FZE", country: "AE", verdict: "CLEARED_INTERNATIONAL_CLEARING", isBlocked: false, isFlagged: false },
    { drawer: "Mahindra Heavy Industries", payee: "Tokyo Automotive Parts Inc", country: "JP", verdict: "CLEARED_INTERNATIONAL_CLEARING", isBlocked: false, isFlagged: false },
    { drawer: "Hawala Syndicate Remittance", payee: "Ahmedabad Bullion Traders", country: "IN", verdict: "AML_BLACKLIST_BLOCKED", isBlocked: true, isFlagged: true },
  ];

  for (let i = 0; i < 30; i++) {
    const sc = sanctionScenarios[i % sanctionScenarios.length];
    const ref = `SANCT-RADAR-2026-${String(6001 + i)}`;
    const chq = createdCheques[i % createdCheques.length];

    await prisma.sanctionsLog.upsert({
      where: { screeningRef: ref },
      update: { verdict: sc.verdict },
      create: {
        screeningRef: ref,
        chequeId: chq.id,
        drawerName: sc.drawer,
        payeeName: sc.payee,
        countryOrigin: sc.country,
        verdict: sc.verdict,
        isBlocked: sc.isBlocked,
        isFlagged: sc.isFlagged,
        screeningDurationMs: 22.5 + (i * 1.5),
        matches: sc.isFlagged ? [
          { list: "OFAC SDN / UN Security Council Consolidated List", entity: sc.payee, score: 94.2, matchType: "JARO_WINKLER_PHONETIC" },
        ] : [],
        auditorOverride: false,
      },
    });
  }

  // ============================================================================
  // 21. WEBHOOK SUBSCRIPTIONS (CBS Gateway Integrations)
  // ============================================================================
  console.log("[21/25] Seeding Webhook Subscriptions...");
  const webhookSubs = [
    { bankCode: "SPCB", system: "Finacle 10.x Core Banking", url: "https://cbs-gw.snb.bank.in/hooks/misdesc", secret: "sec_spcb_finacle_prod_89a1" },
    { bankCode: "HDB",  system: "Flexcube Corporate Core", url: "https://cbs-switch.hdfcbank.com/api/v2/cheque-events", secret: "sec_hdb_flexcube_prod_77b2" },
    { bankCode: "SBIN", system: "TCS BaNCS Universal Banking", url: "https://bancs-gw.sbi.co.in/misdesc-notifications", secret: "sec_sbin_bancs_prod_11c3" },
    { bankCode: "ICIC", system: "Finacle Core Treasury Switch", url: "https://treasury-cbs.icicibank.com/hooks/clearing", secret: "sec_icic_finacle_prod_22d4" },
    { bankCode: "PUNB", system: "Finacle Enterprise Hub", url: "https://cbs.punb.co.in/misdesc/inward-stream", secret: "sec_punb_finacle_prod_33e5" },
    { bankCode: "UTIB", system: "Finacle 11 Integration Bus", url: "https://axis-switch.axisbank.com/hooks/cts", secret: "sec_axis_finacle_prod_44f6" },
  ];

  const createdSubs = [];
  for (const ws of webhookSubs) {
    let sub = await prisma.webhookSubscription.findFirst({ where: { bankCode: ws.bankCode } });
    if (!sub) {
      sub = await prisma.webhookSubscription.create({
        data: {
          bankCode: ws.bankCode,
          systemName: ws.system,
          targetUrl: ws.url,
          secretKey: ws.secret,
          events: ["CHEQUE_PRESENTED", "LIEN_EARMARKED", "LSM_CYCLE_SETTLED", "DISPUTE_FILED", "SWARM_AUTO_CLEARED"],
          isActive: true,
        },
      });
    }
    createdSubs.push(sub);
  }

  // ============================================================================
  // 22. WEBHOOK DELIVERIES (Event Audit Log)
  // ============================================================================
  console.log("[22/25] Seeding Webhook Deliveries...");
  const eventTypes = ["CHEQUE_PRESENTED", "LIEN_EARMARKED", "LSM_CYCLE_SETTLED", "DISPUTE_FILED", "SWARM_AUTO_CLEARED"];

  for (let i = 0; i < 35; i++) {
    const sub = createdSubs[i % createdSubs.length];
    const evType = eventTypes[i % eventTypes.length];
    const isSuccess = i % 8 !== 0;

    await prisma.webhookDelivery.create({
      data: {
        subscriptionId: sub.id,
        eventType: evType,
        payload: {
          eventId: `EVT-${Date.now().toString().slice(-6)}-${i}`,
          eventType: evType,
          bankCode: sub.bankCode,
          timestamp: now.toISOString(),
          details: { amount: 150000 + (i * 25000), instrumentRef: `CHQ-REF-${100 + i}` },
        },
        signature: sha256(`HMAC-${sub.secretKey}-${evType}-${i}`),
        statusCode: isSuccess ? 200 : 503,
        responseBody: isSuccess ? '{"status":"ACK","received":true}' : '{"error":"Core CBS Service Unavailable (Gateway Timeout)"}',
        attempts: isSuccess ? 1 : 3,
        status: isSuccess ? "DELIVERED" : "RETRYING",
        createdAt: new Date(now.getTime() - (35 - i) * 20 * 60 * 1000),
      },
    });
  }

  // ============================================================================
  // 23. BANK REPORTS (MIS & Statutory Regulatory Returns)
  // ============================================================================
  console.log("[23/25] Seeding Bank Reports (All 12 Statutory Return Formats)...");
  const reportTypes = [
    { type: "DAILY_CLEARING_SUMMARY", title: "Daily CTS Clearing & Outward/Inward Settlement Summary", fmt: "CSV" },
    { type: "RBI_STATUTORY_RETURN", title: "RBI Statutory Cheque Dishonour & Return Memo Register (Form VI)", fmt: "PDF" },
    { type: "HIGH_VALUE_PPS_RECON", title: "High-Value Positive Pay System (PPS) Compliance & Discrepancy Audit", fmt: "XLSX" },
    { type: "INTERBANK_SETTLEMENT_MNS", title: "e-Kuber Multilateral Net Settlement (MNS) Batch Realisation Ledger", fmt: "CSV" },
    { type: "BRANCH_OPERATIONS_AUDIT", title: "Branch-wise Instrument Inward/Outward Clearing Operations Register", fmt: "PDF" },
    { type: "FORENSIC_FRAUD_EXCEPTION", title: "Forensic Image Tampering & Multi-Spectrum UV Discrepancy Exception Log", fmt: "JSON" },
    { type: "CHEQUE_RETURN_ANALYSIS", title: "Cheque Dishonour & Reason-wise Return Volumetric Trends Analysis", fmt: "CSV" },
    { type: "CUSTOMER_EXPOSURE_MIS", title: "High-Value Drawer Customer Cumulative Exposure & Concentration Risk", fmt: "XLSX" },
    { type: "SESSION_RECONCILIATION_AUDIT", title: "Session-wise Two-Way Outward vs Inward Clearing Reconciliation", fmt: "CSV" },
    { type: "INTRADAY_LIQUIDITY_BUFFER", title: "Central Bank Intraday Liquidity Pool Utilization & Collateral Headroom", fmt: "PDF" },
    { type: "BRANCH_SLA_PERFORMANCE", title: "Branch Clearing Processing Speed & Maker-Checker SLA Efficiency", fmt: "CSV" },
    { type: "SUSPICIOUS_VELOCITY_AML", title: "Anti-Money Laundering (AML) Suspicious Cheque Velocity & Structuring Alert", fmt: "JSON" },
  ];

  for (let i = 0; i < reportTypes.length; i++) {
    const rt = reportTypes[i];
    const ref = `RPT-20261016-${String(2001 + i)}`;

    await prisma.bankReport.upsert({
      where: { reportRef: ref },
      update: { status: "COMPLETED" },
      create: {
        reportRef: ref,
        reportType: rt.type,
        title: rt.title,
        description: `Official institutional MIS regulatory return generated for SURAT PEOPLES CO OP BANK under RBI CTS-2010 mandates.`,
        format: rt.fmt,
        status: "COMPLETED",
        bankName: "SURAT PEOPLES CO OP BANK",
        branchName: i % 2 === 0 ? "Athwa Lines Branch" : "Ring Road Textile Hub",
        generatedByRole: "ADMIN",
        generatedByName: "System Admin",
        generatedByEmail: "admin@MISDESC.com",
        dateFrom: new Date(now.getTime() - 7 * 24 * 3600 * 1000),
        dateTo: now,
        recordCount: 65,
        totalAmount: 145000000.0,
        clearedAmount: 118000000.0,
        returnedAmount: 27000000.0,
        parameters: { sessionCode: "SESSION-MORNING-01", cycle: "T+0 Continuous" },
        summaryData: {
          totalInstrumentsPresented: 65,
          totalInstrumentsCleared: 48,
          totalInstrumentsReturned: 7,
          totalInstrumentsAwaitingChecker: 10,
          grossRealisationRate: "89.2%",
          pqcSigned: true,
          zkProofVerifiedCount: 16,
        },
        tabularData: [
          { item: "Cheque #000101", drawerAccount: "102030401001", amount: 450000, payee: "Larsen & Toubro Ltd", status: "CLEARED" },
          { item: "Cheque #000102", drawerAccount: "102030401002", amount: 1250000, payee: "Reliance Retail", status: "CLEARED" },
          { item: "Cheque #000103", drawerAccount: "102030401003", amount: 850000, payee: "Tata Consultancy", status: "CLEARED" },
          { item: "Cheque #000104", drawerAccount: "102030401004", amount: 320000, payee: "Infosys BPO", status: "CLEARED" },
          { item: "Cheque #000105", drawerAccount: "102030401005", amount: 95000, payee: "Shree Ram Textiles", status: "CLEARED" },
          { item: "Cheque #000106", drawerAccount: "102030401006", amount: 2100000, payee: "Mahindra Heavy", status: "AWAITING_CHECKER" },
          { item: "Cheque #000107", drawerAccount: "102030401007", amount: 4500000, payee: "Adani Solar Power", status: "AWAITING_CHECKER" },
          { item: "Cheque #000108", drawerAccount: "102030401008", amount: 180000, payee: "Zomato Supply", status: "RETURNED", reason: "01 - Funds Insufficient" },
          { item: "Cheque #000109", drawerAccount: "102030401009", amount: 64000, payee: "Delta Healthcare", status: "RETURNED", reason: "02 - Signature Differs" },
        ],
        downloadUrl: `/api/reports/${ref}/download?format=${rt.fmt}`,
      },
    });
  }

  console.log("==================================================================");
  console.log("   BULK SEED COMPLETE! ALL 25 PRISMA TABLES POPULATED WITH DATA   ");
  console.log("==================================================================");
}

main()
  .catch((e) => {
    console.error("Seed execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
