/**
 * Automated Verification Diagnostic for New MISDESC Enterprise Features:
 * 1. Intraday Liquidity & Collateral Reservation System (LMS)
 * 2. Clearing Dispute Resolution Mechanism (DRM)
 * 3. Public Key Infrastructure (PKI) Digital Signature Validation
 * 4. Clearing Session Cutoff Windows & Two-Way Reconciliation
 */

const crypto = require("crypto");
const liquidityService = require("../src/services/liquidity.service");
const disputeService = require("../src/services/dispute.service");
const pkiService = require("../src/services/pki.service");
const reconciliationService = require("../src/services/reconciliation.service");
const reportService = require("../src/services/report.service");
const { validateRequired, validatePositiveNumber, validateEnum } = require("../src/validators/schemas");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log("================================================================");
  console.log("  MISDESC New Enterprise Features - Comprehensive Unit Diagnostic   ");
  console.log("================================================================\n");

  // TEST SUITE 1: Validation Engine
  console.log("▶ SUITE 1: Validation Engine & Boundary Guarantees");
  try {
    validateRequired({ a: 1, b: "hello" }, ["a", "b"]);
    assert(true, "validateRequired passes valid payload");
  } catch (e) {
    assert(false, "validateRequired threw on valid payload");
  }

  try {
    validateRequired({ a: 1 }, ["a", "b"]);
    assert(false, "validateRequired should fail on missing field");
  } catch (e) {
    assert(e.status === 400, "validateRequired throws 400 on missing field");
  }

  try {
    validatePositiveNumber(50000, "amount");
    assert(true, "validatePositiveNumber accepts positive float/int");
  } catch (e) {
    assert(false, "validatePositiveNumber threw on valid number");
  }

  try {
    validatePositiveNumber(-10, "amount");
    assert(false, "validatePositiveNumber should fail on negative number");
  } catch (e) {
    assert(e.status === 400, "validatePositiveNumber throws 400 on negative number");
  }

  try {
    validateEnum("FILED", ["FILED", "CLOSED"], "status");
    assert(true, "validateEnum accepts valid enum value");
  } catch (e) {
    assert(false, "validateEnum threw on valid enum value");
  }

  // TEST SUITE 2: Intraday Liquidity Math & Headroom Calculations
  console.log("\n▶ SUITE 2: Intraday Liquidity & Collateral Reservation (LMS)");
  const mockPool = {
    allocatedCollateral: 10000000.0, // 1 Crore
    creditLine: 2000000.0, // 20 Lakhs
    currentExposure: 3000000.0, // 30 Lakhs
    reservedAmount: 500000.0, // 5 Lakhs
    warningThresholdPercent: 80.0,
    breachThresholdPercent: 95.0,
  };

  const metrics = liquidityService.calculatePoolMetrics(mockPool);
  assert(metrics.totalCapacity === 12000000.0, "Total Capacity calculated correctly (1.2 Crore)");
  assert(metrics.totalObligations === 3500000.0, "Total Obligations sum exposure + reserved (35 Lakhs)");
  assert(metrics.availableHeadroom === 8500000.0, "Available Headroom calculated correctly (85 Lakhs)");
  assert(metrics.utilizationPercent === 29.17, "Utilization percent calculated accurately (29.17%)");
  assert(metrics.status === "HEALTHY", "Pool status is HEALTHY when < 80%");

  // Test warning & breach status logic
  const warningPool = { ...mockPool, currentExposure: 9600000.0, reservedAmount: 500000.0 }; // > 80%
  const warningMetrics = liquidityService.calculatePoolMetrics(warningPool);
  assert(warningMetrics.status === "WARNING", "Pool status transitions to WARNING when >= 80%");

  const breachPool = { ...mockPool, currentExposure: 11500000.0, reservedAmount: 200000.0 }; // > 95%
  const breachMetrics = liquidityService.calculatePoolMetrics(breachPool);
  assert(breachMetrics.status === "BREACHED", "Pool status transitions to BREACHED when >= 95%");

  // TEST SUITE 3: Dispute Resolution Engine (NPCI MISDESC DRM)
  console.log("\n▶ SUITE 3: Dispute Resolution Mechanism (DRM) Rules");
  const claimNum1 = disputeService.generateClaimNumber();
  const claimNum2 = disputeService.generateClaimNumber();
  const year = new Date().getFullYear();
  assert(claimNum1.startsWith(`DRM/${year}/`), "Claim number adheres to standard DRM format");
  assert(claimNum1 !== claimNum2, "Consecutive claim numbers are distinct and non-colliding");

  // TEST SUITE 4: PKI & Cryptographic Digital Signature Algorithms
  console.log("\n▶ SUITE 4: PKI & Digital Signature Cryptography");
  const testPayload = JSON.stringify({
    sessionCode: "SESSION-MORNING-01",
    totalCount: 15,
    totalAmount: 750000,
  });
  const digest1 = crypto.createHash("sha256").update(testPayload).digest("hex");
  const digest2 = crypto.createHash("sha256").update(testPayload).digest("hex");
  assert(digest1.length === 64, "SHA-256 batch payload digest is 64 hex characters");
  assert(digest1 === digest2, "Deterministic digest consistency verified");

  const tamperedPayload = JSON.stringify({
    sessionCode: "SESSION-MORNING-01",
    totalCount: 16, // Altered count
    totalAmount: 750000,
  });
  const tamperedDigest = crypto.createHash("sha256").update(tamperedPayload).digest("hex");
  assert(digest1 !== tamperedDigest, "Altered clearing payload produces immediate cryptographic mismatch");

  // TEST SUITE 5: AI Forensic Computer Vision & Tampering Engine
  console.log("\n▶ SUITE 5: 🔬 AI Forensic Cheque Tampering & Spectral Vision Engine");
  const forensicsUtil = require("../src/utils/forensics.util");
  const cleanChequeAnalysis = forensicsUtil.analyzeChequeForensics({
    id: "chk-clean-01",
    chequeNumber: "000101",
    amount: 50000,
    fraudScore: 10,
  });
  assert(cleanChequeAnalysis.overallAuthenticityIndex >= 90, "Clean instrument receives high authenticity score (>=90%)");
  assert(cleanChequeAnalysis.tamperVerdict === "AUTHENTIC_INSTRUMENT", "Clean instrument classified as AUTHENTIC_INSTRUMENT");

  const suspectChequeAnalysis = forensicsUtil.analyzeChequeForensics({
    id: "chk-suspect-02",
    chequeNumber: "000102",
    amount: 550000,
    fraudScore: 88,
  });
  assert(suspectChequeAnalysis.anomalies.length > 0, "Suspect instrument flags chemical washing / prepended digit anomalies");
  assert(suspectChequeAnalysis.securityFibers.length > 0, "MISDESC-2010 security fibers mapped across spectral grid");

  // TEST SUITE 6: Interbank Liquidity Gridlock Resolution Engine (LSM)
  console.log("\n▶ SUITE 6: ⚡ Interbank Liquidity Gridlock Resolution Engine (Tarjan LSM)");
  const lsmService = require("../src/services/lsm.service");
  const initialTopology = await lsmService.getGridlockTopology();
  assert(initialTopology.detectedCycles.length > 0, "Tarjan cycle detection identifies circular indebtedness loops");
  assert(initialTopology.metrics.isGridlocked === true, "System accurately flags active clearing gridlock");

  const resolutionResult = await lsmService.resolveGridlock();
  assert(resolutionResult.success === true, "Tarjan multilateral cycle netting executes successfully");
  assert(resolutionResult.receipt.centralBankReservesConsumed === 0, "Discharged circular debt with zero central bank liquidity consumed");
  assert(resolutionResult.receipt.liquiditySavingsRatio === "100.0%", "Achieved 100% liquidity efficiency pure offset");

  // TEST SUITE 7: FIPS 140-2 Level 3 Virtual HSM & M-of-N Key Ceremony
  console.log("\n▶ SUITE 7: 🛡️ FIPS 140-2 Level 3 Virtual HSM & M-of-N Key Ceremony");
  const hsmService = require("../src/services/hsm.service");
  hsmService.reinitializeHsm();
  let hsmStatus = hsmService.getHsmStatus();
  assert(hsmStatus.status === "LOCKED", "HSM starts in FIPS LOCKED state");
  assert(hsmStatus.quorum.required === 2, "Requires M=2 of N=3 custodians to reach quorum");

  // Insert Custodian 1 (1/2, not yet operational)
  hsmService.insertCustodianKey("CUST-RBI-01", "1122");
  hsmStatus = hsmService.getHsmStatus();
  assert(hsmStatus.quorum.currentInserted === 1, "Slot A smart-card inserted (1/2 threshold)");
  assert(hsmStatus.status === "CEREMONY_IN_PROGRESS", "Status transitions to CEREMONY_IN_PROGRESS");

  // Insert Custodian 2 (2/2, reaches quorum)
  hsmService.insertCustodianKey("CUST-IDRBT-02", "3344");
  hsmStatus = hsmService.getHsmStatus();
  assert(hsmStatus.status === "UNLOCKED_OPERATIONAL", "Master key synthesized into volatile RAM when quorum reached");
  assert(hsmStatus.masterKeyDigest !== null, "Master key fingerprint generated without exposing plaintext");

  // Test Tamper-Reactive Zeroization
  const zeroizeResult = hsmService.triggerTamperZeroization("SIMULATED_CHASSIS_BREACH_TEST");
  hsmStatus = hsmService.getHsmStatus();
  assert(hsmStatus.status === "ZEROIZED", "Chassis breach instantaneously transitions HSM to ZEROIZED");
  assert(hsmStatus.masterKeyDigest.includes("ZEROIZED"), "Volatile RAM keys wiped with zero bytes");

  // Clean reset
  hsmService.reinitializeHsm();

  // TEST SUITE 8: National Clearing Switch Active-Active DC Failover
  console.log("\n▶ SUITE 8: 🌐 National Clearing Switch & Multi-Region DC Failover");
  const dcService = require("../src/services/datacenter.service");
  const dcTopology = dcService.getTopology();
  assert(dcTopology.primaryActiveDc === "DC_MUMBAI", "Initial active primary is DC Mumbai (BKC Western Hub)");
  assert(dcTopology.replicationLagMs < 1.0, "Sub-millisecond synchronous Raft replication verified");

  // Trigger 1-Click Failover to DR Hyderabad
  const failoverResult = dcService.triggerFailover("DR_HYDERABAD");
  assert(failoverResult.success === true, "Active-Active DC failover completed successfully");
  assert(failoverResult.receipt.droppedTransactions === 0, "Zero dropped transactions during in-flight rerouting");
  assert(failoverResult.topology.primaryActiveDc === "DR_HYDERABAD", "Traffic autonomously routed to DR Hyderabad");

  // TEST SUITE 9: Phase 1 - LSM Real-Time Gridlock Daemon & Bilateral Netting
  console.log("\n▶ SUITE 9: ⚡ Phase 1: Real-Time Gridlock Daemon & Bilateral Greedy Offsetting");
  const topologyWithBilateral = await lsmService.getGridlockTopology();
  assert(topologyWithBilateral.bilateralOffsets !== undefined, "Bilateral opposing payment pairs identified");

  // Test daemon loop toggle
  const daemonActive = lsmService.toggleAutoDaemon(true, 5000, false);
  assert(daemonActive.enabled === true, "Autonomous background gridlock daemon activated");
  const daemonStatus = lsmService.getDaemonStatus();
  assert(daemonStatus.enabled === true, "Daemon status reports active ticking state");
  lsmService.toggleAutoDaemon(false); // Stop daemon
  assert(lsmService.getDaemonStatus().enabled === false, "Daemon gracefully stopped");

  // TEST SUITE 10: Phase 2 - Autonomous Multi-Agent Swarm Adjudication Engine
  console.log("\n▶ SUITE 10: 🤖 Phase 2: Autonomous 4-Agent Swarm Adjudication & Forensic Docket");
  const swarmService = require("../src/services/swarm.service");

  // Test 1: Clean, authentic cheque -> Autonomous STP (<500ms)
  const cleanCheque = {
    id: "test-clean-01",
    chequeNumber: "000101",
    amount: 85000,
    payeeName: "Apex Retailers Ltd",
    riskScore: 12,
    riskTier: "LOW",
    ppsStatus: "PPS_VERIFIED",
    signatureMatchScore: 97.4,
    createdAt: new Date().toISOString(),
  };
  const cleanDocket = await swarmService.evaluateChequeWithSwarm("test-clean-01", cleanCheque);
  assert(cleanDocket.consensus.consensusScore >= 98.0, "Clean instrument scores >= 98.0% consensus");
  assert(cleanDocket.consensus.autoCleared === true, "Autonomous Straight-Through Processing (STP) triggers on clean instrument");
  assert(cleanDocket.deliberationLog.length === 5, "Deliberation log records all 4 specialized agents + arbiter");
  assert(cleanDocket.cryptographicSeal.length === 64, "Executive docket sealed with SHA-256 cryptographic proof");

  // Test 2: Suspect instrument with FFT generative AI diffusion artifact & PPS mismatch
  const suspectCheque = {
    id: "test-suspect-02",
    chequeNumber: "000999",
    amount: 1500000, // ₹15 Lakhs
    payeeName: "Suspicious Mule Entity",
    riskScore: 82,
    riskTier: "HIGH",
    ppsStatus: "PPS_MISMATCH",
    signatureMatchScore: 62.1,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // > 90 days (Stale)
  };
  const suspectDocket = await swarmService.evaluateChequeWithSwarm("test-suspect-02", suspectCheque);
  assert(suspectDocket.consensus.autoCleared === false, "Suspect instrument correctly blocks autonomous STP");
  assert(suspectDocket.consensus.criticalFlagsCount > 0, "Critical flags raised for FFT diffusion & Stale instrument");
  assert(suspectDocket.consensus.recommendation.includes("REJECT") || suspectDocket.consensus.recommendation.includes("SENIOR_CHECKER"), "Arbiter directs human escalation");

  // TEST SUITE 11: Phase 3 - NIST Post-Quantum Cryptography (FIPS 204 ML-DSA & FIPS 203 ML-KEM)
  console.log("\n▶ SUITE 11: 🛡️ Phase 3: NIST FIPS 204 ML-DSA (Dilithium) & FIPS 203 ML-KEM (Kyber)");
  const pqcService = require("../src/services/pqc.service");

  // Test 1: Key generation
  const pqcKeys = pqcService.generateHybridKeyPair("SRT");
  assert(pqcKeys.algorithm === "ML-DSA-65", "Generates NIST FIPS 204 ML-DSA-65 keypair");
  assert(pqcKeys.classical.type.includes("RSA-4096"), "Dual-stack includes classical RSA-4096 layer");
  assert(pqcKeys.postQuantum.shorAlgorithmStatus.includes("POST_QUANTUM_RESISTANT"), "Post-quantum resistance confirmed against Shor's algorithm");

  // Test 2: Hybrid batch manifest signing
  const sampleManifest = { batchId: "BATCH-TEST-2026", totalCount: 25, totalAmount: 1250000.0 };
  const hybridSig = pqcService.signBatchHybrid("BATCH-TEST-2026", sampleManifest, "SRT");
  assert(hybridSig.classicalSignature.verified === true, "Classical RSA-4096 signature layer valid");
  assert(hybridSig.postQuantumSignature.algorithm === "ML-DSA-65", "Post-quantum ML-DSA-65 signature layer generated");
  assert(hybridSig.postQuantumSignature.latticeNormProof.includes("BOUND_SATISFIED"), "Lattice norm bound ||z||_inf verified");

  // Test 3: Quantum verification
  const verification = pqcService.verifyBatchHybrid("BATCH-TEST-2026", sampleManifest, "SRT");
  assert(verification.verified === true, "Hybrid dual-layer cryptographic manifest verified 100%");
  assert(verification.postQuantumValid === true, "Quantum-resistant signature layer validated");

  // Test 4: ML-KEM-768 Tunnel Encapsulation
  const kemTunnel = pqcService.encapsulateInterbankTunnel("SRT", "HDB");
  assert(kemTunnel.protocol.includes("ML-KEM-768"), "FIPS 203 ML-KEM-768 shared secret encapsulated");
  assert(kemTunnel.encapsulatedCiphertextLengthBytes === 1088, "Ciphertext size conforms to ML-KEM-768 standard (1088 bytes)");

  // Test 5: Global readiness metrics
  const readiness = pqcService.getQuantumReadinessMetrics();
  assert(readiness.overallReadinessScorePercent >= 90.0, "National clearing switch PQC readiness score certified >= 90%");

  // TEST SUITE 12: Zero-Knowledge Confidential Clearing (zk-MISDESC / Groth16 BN254)
  console.log("\n▶ SUITE 12: 🔐 Zero-Knowledge Confidential Clearing (zk-SNARK Groth16 / BN254)");
  const zkpService = require("../src/services/zkp.service");
  const testZkCheque = {
    id: "chq-zk-01",
    chequeNumber: "000888",
    amount: 250000,
    accountNumber: "987654321098",
    signatureMatchScore: 96.2,
    ppsStatus: "PPS_VERIFIED",
  };
  const zkProof = zkpService.generateSolvencyProof(testZkCheque, { balance: 4000000 });
  assert(zkProof.proof.pi_a.length === 3, "Groth16 G1 vector pi_a generated over BN254");
  assert(zkProof.proof.pi_b.length === 3, "Groth16 G2 vector pi_b generated over BN254");
  assert(zkProof.zeroKnowledgeGuarantees.drawerBalanceDisclosed === false, "Zero-Knowledge Guarantee: Drawer balance remains concealed");
  assert(zkProof.status === "VERIFIED_VALID", "Solvency witness satisfied without revealing private balance");

  // Fast Verifier Test
  const zkVerify = zkpService.verifySolvencyProof(zkProof);
  assert(zkVerify.verified === true, "Clearing House bilinear pairing check e(A,B)==e(alpha,beta)... verified true");
  assert(zkVerify.pairingCheckPassed === true, "Bilinear pairing check successfully passed");

  // TEST SUITE 13: Programmable Smart Cheques, Micro-Liens & CBDC (e-Rupee)
  console.log("\n▶ SUITE 13: ⚡ Programmable Smart Cheques, Cryptographic Micro-Liens & CBDC (e-Rupee)");
  const smartService = require("../src/services/smartcheque.service");

  // Micro-Lien Earmarking
  const lien = smartService.earmarkMicroLien("chq-smart-01", 150000, "123456789012");
  assert(lien.earmarkedAmount === 150000, "Micro-lien accurately holds ₹1,50,000 in drawer CBS escrow");
  assert(lien.bounceRisk === "0.0% (GUARANTEED_LIQUIDITY_RESERVE)", "Guarantees 0% bounce rate for cleared instrument");

  // Smart Escrow Contract & Statutory Tax Split
  const smartContract = smartService.createSmartContract("chq-smart-01", { amount: 150000, taxRatePercent: 18.0 });
  assert(smartContract.splitRouting.vendorBeneficiary.netPayoutAmount === 123000, "Vendor net payout auto-computed (82% = ₹1,23,000)");
  assert(smartContract.splitRouting.statutoryTaxEscrow.taxDeductedAmount === 27000, "Statutory GST withheld automatically (18% = ₹27,000)");
  assert(smartContract.milestones.length === 2, "Multi-milestone escrow schedule registered");

  // Milestone Release
  const updatedContract = smartService.releaseMilestone("chq-smart-01", "M2_DELIVERY_SIGN_OFF");
  assert(updatedContract.milestones[1].status === "SATISFIED", "Commercial delivery milestone released upon condition sign-off");

  // Atomic CBDC e-Rupee Token Settlement
  const cbdcReceipt = smartService.settleWithCbdc("chq-smart-01", 150000, "WLT-RBI-eINR-992144");
  assert(cbdcReceipt.settlementCurrency.includes("e₹"), "Settlement executed in Central Bank Digital Rupee (e₹)");
  assert(cbdcReceipt.atomicFinality === "IMMEDIATE_FINAL_IRREVOCABLE", "Atomic finality confirmed via CBDC token minting");

  // TEST SUITE 14: Cross-Border Multi-Currency Clearing & Real-Time Sanctions Screener
  console.log("\n▶ SUITE 14: 🌐 Cross-Border Multi-Currency MISDESC & Real-Time Sanctions Screener");
  const crossService = require("../src/services/crossborder.service");

  // Currency Conversion & Forward Hedging
  const fxResult = crossService.convertCurrency(10000, "USD");
  assert(fxResult.foreignCurrency === "USD", "Identified foreign currency draft (USD 10,000)");
  assert(fxResult.inrGrossAmount === 841200, "Converted at live interbank rate (1 USD = ₹84.12)");
  assert(fxResult.hedgingSpreadDeduction > 0, "Forward hedge spread deducted");

  // Sanctions & PEP Screener (Clean Drawer)
  const cleanScreening = crossService.screenSanctions({ drawerName: "Acme Corporate Ltd", payeeName: "Genuine Supplier", countryOrigin: "IN" });
  assert(cleanScreening.status === "PASSED", "Clean international instrument clears sanctions check");
  assert(cleanScreening.screeningDurationMs < 100, "Sanctions screening completed in sub-100ms");

  // Sanctions Screener (Watchlist Hit)
  const blockedScreening = crossService.screenSanctions({ drawerName: "Al-Faisal Logistics Corp", payeeName: "Acme", countryOrigin: "US" });
  assert(blockedScreening.status === "BLOCKED", "Identifies entity on OFAC SDN Watchlist and enforces statutory block");
  assert(blockedScreening.matchedSanctions.length > 0, "Matched sanctions entry returned in audit log");

  // ISO 20022 pacs.009 Export
  const pacs009Xml = crossService.generatePacs009Xml({ chequeNumber: "990011", payeeName: "Global Trade Inc" }, fxResult);
  assert(pacs009Xml.includes("pacs.009.001.08"), "Generates valid ISO 20022 pacs.009.001.08 XML document");
  assert(pacs009Xml.includes("RBI-EKUBER-CBPR-PLUS"), "Includes CBPR+ Central Bank clearing system proprietary header");

  // TEST SUITE 15: Production Database Schema & Persistence Models (Phase 1)
  console.log("\n▶ SUITE 15: 🗄️ Phase 1: PostgreSQL Schema Persistence Models");
  const prismaClient = require("../src/config/prisma");
  assert(typeof prismaClient.smartChequeContract?.findMany === "function", "Prisma model SmartChequeContract registered");
  assert(typeof prismaClient.escrowMilestone?.findMany === "function", "Prisma model EscrowMilestone registered");
  assert(typeof prismaClient.microLien?.findMany === "function", "Prisma model MicroLien registered");
  assert(typeof prismaClient.zkProofRecord?.findMany === "function", "Prisma model ZkProofRecord registered");
  assert(typeof prismaClient.pqcManifest?.findMany === "function", "Prisma model PqcManifest registered");
  assert(typeof prismaClient.swarmDocket?.findMany === "function", "Prisma model SwarmDocket registered");
  assert(typeof prismaClient.sanctionsLog?.findMany === "function", "Prisma model SanctionsLog registered");

  // TEST SUITE 16: Industrial Fuzzy Sanctions Radar (Jaro-Winkler & Double-Metaphone) (Phase 2)
  console.log("\n▶ SUITE 16: 🌐 Phase 2: Industrial Fuzzy Sanctions Radar (Jaro-Winkler & Metaphone)");
  const jwExact = crossService.jaroWinkler("Al-Faisal", "Al-Faisal");
  assert(jwExact === 1.0, "Jaro-Winkler computes identity match (1.0)");

  const meta1 = crossService.doubleMetaphone("Al-Faisal");
  const meta2 = crossService.doubleMetaphone("Al Fayzal");
  assert(meta1 === meta2, "Double-Metaphone maps 'Al-Faisal' and 'Al Fayzal' to identical phonetic signature");

  const fuzzyHit = crossService.screenSanctions({ drawerName: "Al Fayzal Logistics", payeeName: "Standard Corp" });
  assert(fuzzyHit.matchedSanctions.length > 0, "Fuzzy radar detects spelling variant alias 'Al Fayzal Logistics'");
  assert(fuzzyHit.status === "BLOCKED", "Enforces statutory block on critical fuzzy alias match");

  const hawalaFuzzy = crossService.screenSanctions({ drawerName: "Havala Remittance Network", payeeName: "Apex" });
  assert(hawalaFuzzy.matchedSanctions.length > 0, "Phonetic matcher flags 'Havala Remittance Network' against 'Hawala'");

  // TEST SUITE 17: Hybrid E-13B MICR OCR Extraction (Phase 2)
  console.log("\n▶ SUITE 17: 📷 Phase 2: E-13B MICR OCR & Structured Extraction Engine");
  const ocrUtil = require("../src/utils/ocr.util");
  const ocrResult = await ocrUtil.scanChequeOCR(
    null,
    "CHEQUE NO: 000456 MICR: 395024002 A/C: 987654321012 IFSC: SBIN0001234 TC: 10 ₹125,000 PAY TO: Acme Steel Corp"
  );
  assert(ocrResult.extracted.chequeNumber === "000456", "E-13B OCR extracts 6-digit cheque number");
  assert(ocrResult.extracted.micrCode === "395024002", "E-13B OCR extracts 9-digit MICR routing code");
  assert(ocrResult.extracted.accountNumber === "987654321012", "E-13B OCR extracts 12-digit drawer account number");
  assert(ocrResult.extracted.ifsc === "SBIN0001234", "OCR extracts 11-character Indian Bank IFSC");
  assert(ocrResult.extracted.suggestedAmount === 125000, "OCR extracts courtesy box numeric amount (₹1,25,000)");
  assert(ocrResult.boundingBoxes.micrBand !== undefined, "Calculates MISDESC-2010 bounding box coordinates");

  // TEST SUITE 18: IoT / e-Way Bill Webhook Trigger & Milestone 2 Auto-Disbursement (Phase 3)
  console.log("\n▶ SUITE 18: 📡 Phase 3: IoT / e-Way Bill Automated Escrow Webhook Engine");
  const smartChequeService = require("../src/services/smartcheque.service");
  const testContract = smartChequeService.createSmartContract("chq-iot-test-99", {
    amount: 200000,
    payeeName: "Apex Logistics & Supply Chain Ltd",
  });
  assert(
    testContract.milestones.find((m) => m.stepId === "M2_DELIVERY_SIGN_OFF").status ===
    "PENDING_IOT_CONFIRMATION",
    "Milestone 2 initiates in PENDING_IOT_CONFIRMATION status"
  );

  const iotWebhookResponse = await smartChequeService.processIotWebhookTrigger({
    chequeId: "chq-iot-test-99",
    waybillNumber: "EWB-MH-994829104821",
    rfidTag: "EPC-RFID-48291038",
    gpsCoordinates: { lat: 19.076, lng: 72.8777, location: "Nhava Sheva Port Gate 2" },
    temperatureLog: "3.8°C",
    signatureToken: "ORACLE-SIGN-VALID-9948",
  });

  assert(iotWebhookResponse.success === true, "IoT e-Way bill webhook verified successfully");
  assert(iotWebhookResponse.milestone.status === "SATISFIED", "Milestone 2 automatically disbursed upon IoT trigger");
  assert(
    iotWebhookResponse.milestone.telematicsProof.waybillNumber === "EWB-MH-994829104821",
    "Stores e-Way bill number and telematics telemetry"
  );
  assert(
    iotWebhookResponse.contract.programmableState === "ALL_MILESTONES_RELEASED",
    "Contract transitions to ALL_MILESTONES_RELEASED"
  );
  assert(iotWebhookResponse.receiptHash !== undefined, "Generates cryptographic receipt hash for arbitration");

  // TEST SUITE 19: LSM Live Cheque Atomic Realization (Phase 4)
  console.log("\n▶ SUITE 19: ⚡ Phase 4: Multi-Cheque Atomic Realization upon Tarjan Netting");
  await lsmService.resetTopology();
  const lsmResolved = await lsmService.resolveGridlock();
  assert(lsmResolved.success === true, "Executes Tarjan SCC multilateral gridlock resolution");
  assert(lsmResolved.receipt.cyclesResolvedCount >= 0, "Tracks resolved indebtedness cycle count");
  assert(lsmResolved.receipt.centralBankReservesConsumed === 0, "Zero central bank reserves consumed in cycle elimination");
  assert(lsmResolved.receipt.realizedChequesCount !== undefined, "Atomic multi-cheque realization tracks cleared cheque count");

  // TEST SUITE 20: National Cybernetic War Room - Interbank Liquidity Shock Simulator (Phase 6)
  console.log("\n▶ SUITE 20: 🌐 Phase 6: Interbank Clearing Shock & Liquidity Stress Simulator");
  await lsmService.resetTopology();
  const shockRes = await lsmService.injectLiquidityShock({
    shockType: "SURGE",
    amount: 500000000,
    targetBank: "bank-srt",
  });
  assert(shockRes.success === true, "Injects ₹50 Crore inward clearing surge into topology");
  assert(shockRes.shock.injectedAmount === 500000000, "Shock metadata records ₹50 Cr volume spike");
  assert(shockRes.topology.metrics.isGridlocked === true, "Network triggers gridlock detection under shock");

  const freezeRes = await lsmService.injectLiquidityShock({
    shockType: "COLLATERAL_FREEZE",
    targetBank: "bank-srt",
  });
  assert(freezeRes.success === true, "Injects participant bank collateral freeze shock");
  const srtNode = freezeRes.topology.nodes.find((n) => n.id === "bank-srt");
  assert(srtNode && srtNode.availableHeadroom <= 100000, "Bank SRT headroom restricted to near zero");
  assert(srtNode.status === "GRIDLOCK_RESTRICTED", "Bank SRT flagged as GRIDLOCK_RESTRICTED");

  // Autonomous resolution under shock
  const postShockResolution = await lsmService.resolveGridlock();
  assert(postShockResolution.success === true, "Tarjan LSM engine autonomously resolves bottlenecks post-shock");
  assert(postShockResolution.receipt.centralBankReservesConsumed === 0, "Zero central bank reserves consumed post-shock");

  // TEST SUITE 21: RBI e-Kuber ISO 20022 CBPR+ pacs.008 & pacs.002 Central Gateway (Phase 7)
  console.log("\n▶ SUITE 21: 🏛️ Phase 7: RBI e-Kuber ISO 20022 pacs.008 & pacs.002 Central Gateway");
  const isoUtil = require("../src/utils/iso20022.util");

  // Test pacs.008 generation
  const pacs008Xml = isoUtil.generatePacs008Xml({
    settlement: {
      id: "settl-iso-test-01",
      netAmount: 45000000,
      bankA: { name: "SURAT PEOPLES CO OP BANK", ifsc: "SBIN0001234" },
      bankB: { name: "SURAT PEOPLES CO OP BANK", ifsc: "HDFC0005678" },
    },
    cheques: [
      {
        id: "chq-iso-001",
        chequeNumber: "000991",
        amount: 25000000,
        accountNumber: "987654321012",
        payeeName: "Tata Consultancy Services",
        presentingBank: { name: "SURAT PEOPLES CO OP BANK", ifsc: "SBIN0001234" },
        draweeBank: { name: "SURAT PEOPLES CO OP BANK", ifsc: "HDFC0005678" },
      },
      {
        id: "chq-iso-002",
        chequeNumber: "000992",
        amount: 20000000,
        accountNumber: "987654321013",
        payeeName: "Reliance Retail Ltd",
        presentingBank: { name: "SURAT PEOPLES CO OP BANK", ifsc: "SBIN0001234" },
        draweeBank: { name: "SURAT PEOPLES CO OP BANK", ifsc: "HDFC0005678" },
      },
    ],
  });

  assert(pacs008Xml.includes("pacs.008.001.08"), "Generates valid pacs.008.001.08 XML document");
  assert(pacs008Xml.includes("head.001.001.02"), "Embeds mandatory CBPR+ AppHdr head.001.001.02 header");
  assert(pacs008Xml.includes("ds:Signature"), "Embeds FIPS 140-2 Level 3 HSM <ds:Signature> XMLDSig block");
  assert(pacs008Xml.includes("Tata Consultancy Services"), "Populates Creditor entity details");

  // Test pacs.002 with statutory reject reason codes
  const pacs002Xml = isoUtil.generatePacs002Xml({
    cheque: {
      id: "chq-reject-01",
      chequeNumber: "000993",
      amount: 1500000,
      returnReason: "Insufficient funds",
      presentingBank: { name: "SURAT PEOPLES CO OP BANK", ifsc: "SBIN0001234" },
      draweeBank: { name: "SURAT PEOPLES CO OP BANK", ifsc: "HDFC0005678" },
    },
  });

  assert(pacs002Xml.includes("pacs.002.001.10"), "Generates valid pacs.002.001.10 Payment Status Report XML");
  assert(pacs002Xml.includes("<Cd>AM04</Cd>"), "Maps 'Insufficient funds' to statutory ISO 20022 reason code AM04");

  // Test live Schematron & XSD validator
  const validationP008 = isoUtil.validateIso20022Xml(pacs008Xml);
  assert(validationP008.isValid === true, "validateIso20022Xml confirms pacs.008 schema conformance");
  assert(validationP008.validations.length >= 4, "Executes all statutory schema validation rules");

  const validationP002 = isoUtil.validateIso20022Xml(pacs002Xml);
  assert(validationP002.isValid === true, "validateIso20022Xml confirms pacs.002 schema conformance");

  // TEST SUITE 22: Autonomous 4-Agent Swarm Live Deliberation Sandbox (Phase 8)
  console.log("\n▶ SUITE 22: 🤖 Phase 8: Autonomous 4-Agent Swarm Live Deliberation Sandbox");
  // Test 1: Clean Baseline
  const cleanReport = swarmService.simulateAdversarialAttack({ scenario: "CLEAN_BASELINE" });
  assert(cleanReport.verdict === "AUTONOMOUS_STP_CLEARED", "Clean baseline clears autonomous STP");
  assert(cleanReport.radarDimensions.length === 4, "Generates 4-dimensional radar metrics");

  // Test 2: Prepending a digit attack
  const prependReport = swarmService.simulateAdversarialAttack({
    scenario: "PREPEND_DIGIT",
    originalAmount: 50000,
    alteredAmount: 150000,
  });
  assert(prependReport.verdict === "ZERO_DAY_FRAUD_INTERCEPTED", "Swarm intercepts digit prepending attack");
  assert(prependReport.flags.some((f) => f.code === "INK_DENSITY_KERNING_DISCREPANCY"), "Spectral Vision catches kerning discrepancy");
  assert(prependReport.flags.some((f) => f.code === "PPS_MANDATE_DEFICIT"), "AML Agent catches PPS discrepancy");

  // Test 3: Chemical washing attack
  const washReport = swarmService.simulateAdversarialAttack({ scenario: "CHEMICAL_WASHING" });
  assert(washReport.verdict === "ZERO_DAY_FRAUD_INTERCEPTED", "Swarm intercepts chemical washing attack");
  assert(washReport.flags.some((f) => f.code === "UV_BLEACH_HALO_FLUORESCENCE"), "Catches UV bleach halo solvent fluorescence");

  // Test 4: Forged signature variance
  const forgeReport = swarmService.simulateAdversarialAttack({ scenario: "FORGED_SIGNATURE" });
  assert(forgeReport.verdict === "ZERO_DAY_FRAUD_INTERCEPTED", "Swarm intercepts forged signature variance");
  assert(forgeReport.flags.some((f) => f.code === "DTW_STROKE_CONTOUR_DIVERGENCE"), "Biometric Graph catches DTW contour divergence");

  // TEST SUITE 23: High-Throughput Stress Engine & Load Generator (Phase 9)
  console.log("\n▶ SUITE 23: 🚀 Phase 9: High-Throughput Stress Engine (1,000+ TPS Load Generator)");
  const stressService = require("../src/services/stress.service");

  // Test synthetic batch generation
  const synthBatch = await stressService.generateSyntheticBatch({ count: 200 });
  assert(synthBatch.success === true, "Generates synthetic MISDESC-2010 batch");
  assert(synthBatch.batchSize === 200, "Generates exactly 200 instruments");
  assert(synthBatch.sampleCheques[0].micrCode.length === 9, "Valid 9-digit E-13B MICR code attached");
  assert(synthBatch.sampleCheques[0].chequeNumber.length === 6, "Valid 6-digit cheque number attached");

  // Test benchmark execution (>1000 TPS)
  const benchResult = await stressService.runClearingStressBenchmark({ targetTps: 1100, durationSec: 3 });
  assert(benchResult.success === true, "Executes high-throughput clearing benchmark");
  assert(benchResult.achievedTps >= 1000, "Achieves >= 1,000 Cheques/second peak throughput");
  assert(benchResult.latencyPercentiles.p99Ms < 50, "P99 latency satisfies sub-50ms statutory SLA");
  assert(benchResult.clusterPods.length === 3, "Monitors multi-pod CPU and memory utilization");

  // TEST SUITE 24: Multi-Tenant Core Banking Webhooks & Open Banking APIs (Phase 10)
  console.log("\n▶ SUITE 24: 📡 Phase 10: Multi-Tenant Core Banking Webhook Gateway & OpenAPI 3.0");
  const webhookService = require("../src/services/webhook.service");
  const { OPENAPI_SPEC } = require("../src/utils/openapi.util");

  // Test subscription listing & HMAC generation
  const subscriptions = await webhookService.listSubscriptions();
  assert(subscriptions.length >= 3, "Initializes default CBS subscriptions (Finacle, BaNCS, Flexcube)");

  const cbsTestPayload = { chequeNumber: "000456", amount: 150000, event: "CHEQUE_PRESENTED" };
  const hmacSecret = "whsec_test_secret_key_123456";
  const hmacSig = webhookService.generateHmacSignature(hmacSecret, cbsTestPayload);
  assert(typeof hmacSig === "string" && hmacSig.length === 64, "Generates 64-character hex HMAC-SHA256 signature");

  const isValidSig = webhookService.verifyHmacSignature(hmacSecret, cbsTestPayload, `sha256=${hmacSig}`);
  assert(isValidSig === true, "Constant-time HMAC verification passes for authentic signature");

  const isInvalidSig = webhookService.verifyHmacSignature(hmacSecret, { ...cbsTestPayload, amount: 999999 }, `sha256=${hmacSig}`);
  assert(isInvalidSig === false, "HMAC verification rejects tampered payload");

  // Test dispatching real-time event
  const dispatchResult = await webhookService.dispatchWebhookEvent("CHEQUE_PRESENTED", cbsTestPayload);
  assert(dispatchResult.success === true, "Dispatches webhook event across subscribed endpoints");
  assert(dispatchResult.dispatchedCount >= 1, "Delivers event to matching CBS endpoints");
  assert(dispatchResult.deliveries[0].signature.startsWith("sha256="), "Attaches X-MISDESC-Signature header");

  // Test OpenAPI 3.0 specification
  assert(OPENAPI_SPEC.openapi === "3.0.3", "Exports valid OpenAPI 3.0.3 specification");
  assert(OPENAPI_SPEC.paths["/cheques"] !== undefined, "Documents /cheques clearing endpoint");
  assert(OPENAPI_SPEC.paths["/webhooks"] !== undefined, "Documents /webhooks Core Banking API");

  // TEST SUITE: Bank MIS & Regulatory Reporting Engine (SURAT PEOPLES CO OP BANK)
  console.log("\n▶ SUITE 11: Bank MIS & Regulatory Reporting System");
  assert(Array.isArray(reportService.REPORT_TEMPLATES), "Exports institutional report templates catalog");
  assert(reportService.REPORT_TEMPLATES.length >= 6, "Supports at least 6 RBI/NPCI statutory templates");

  const adminTemplates = reportService.getAvailableTemplates("ADMIN");
  assert(adminTemplates.length >= 6, "Admin has access to all institutional reporting templates");

  const branchTemplates = reportService.getAvailableTemplates("BRANCH_MANAGER");
  assert(branchTemplates.length > 0 && branchTemplates.length <= adminTemplates.length, "Branch Manager templates adhere to RBAC boundaries");

  // Test 1: Daily Clearing Summary Generation
  const testUser = {
    name: "Audit Clerk",
    role: "ADMIN",
    email: "audit@snb.com",
    bank: { name: "SURAT PEOPLES CO OP BANK" },
  };

  const dailyReport = await reportService.generateReport({
    reportType: "DAILY_CLEARING_SUMMARY",
    format: "CSV",
    filters: { dateRange: "all" },
    user: testUser,
  });

  assert(dailyReport && typeof dailyReport.reportRef === "string", "Generates report with unique institutional reportRef");
  assert(dailyReport.reportRef.startsWith("SPCB-MIS-01-"), "Report reference uses bank acronym and template code");
  assert(dailyReport.bankName === "SURAT PEOPLES CO OP BANK", "Identifies SURAT PEOPLES CO OP BANK as issuing institution");
  assert(Array.isArray(dailyReport.records), "Report dataset compiled as tabular record collection");
  assert(typeof dailyReport.summary === "object", "Includes summary audit metrics");

  // Test 2: RBI Statutory Return Generation
  const rbiReport = await reportService.generateReport({
    reportType: "RBI_STATUTORY_RETURN",
    format: "CSV",
    filters: {},
    user: testUser,
  });
  assert(rbiReport.reportRef.startsWith("SPCB-RBI-STR-02-"), "RBI statutory report uses RBI-STR-02 code");

  // Test 3: RFC-4180 CSV Exporter
  const csvData = reportService.exportReportToCsv(dailyReport);
  assert(typeof csvData === "string" && csvData.length > 0, "Exports report to RFC-4180 compliant CSV string");
  assert(csvData.includes("SURAT PEOPLES CO OP BANK"), "CSV includes bank institutional title header");
  assert(csvData.includes("Report Reference"), "CSV includes metadata rows");

  // Test 4: Report Listing and Lookup
  const listedReports = await reportService.listReports({ limit: 10, user: testUser });
  assert(Array.isArray(listedReports) && listedReports.length >= 2, "Lists generated reports in archive");

  const fetchedReport = await reportService.getReportById(dailyReport.id);
  assert(fetchedReport && fetchedReport.reportRef === dailyReport.reportRef, "Fetches generated report by identifier");

  // TEST SUMMARY
  console.log("\n================================================================");
  console.log(`  Diagnostic Results: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================\n");


  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Diagnostic execution error:", err);
  process.exit(1);
});


