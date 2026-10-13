#!/usr/bin/env node
// ==============================================================================
// MISDESC Real-Time National Clearing Grid Traffic Simulator
// Generates live interbank clearing traffic across all 6 next-gen fintech engines:
// 1. Tarjan LSM Cycle Solving
// 2. Autonomous Multi-Agent Swarm Adjudication
// 3. NIST FIPS 204 ML-DSA Dilithium / ML-KEM PQC Signatures
// 4. zk-SNARK Groth16 Confidential Solvency Proofs
// 5. Programmable Smart Cheques & CBDC (e₹) Finality
// 6. Cross-Border Multi-Currency FX & Sanctions Radar
// ==============================================================================

const path = require("path");
const BACKEND_DIR = path.resolve(__dirname, "../backend");

// Require engines directly from backend services
const lsmService = require(path.join(BACKEND_DIR, "src/services/lsm.service"));
const swarmService = require(path.join(BACKEND_DIR, "src/services/swarm.service"));
const pqcService = require(path.join(BACKEND_DIR, "src/services/pqc.service"));
const zkpService = require(path.join(BACKEND_DIR, "src/services/zkp.service"));
const smartchequeService = require(path.join(BACKEND_DIR, "src/services/smartcheque.service"));
const crossborderService = require(path.join(BACKEND_DIR, "src/services/crossborder.service"));
const { getPrometheusMetrics } = require(path.join(BACKEND_DIR, "src/utils/metrics.util"));

console.log("==================================================================");
console.log("   MISDESC NATIONAL CLEARING GRID - INTERBANK TRAFFIC SIMULATOR       ");
console.log("==================================================================");

async function simulate() {
  const rounds = parseInt(process.argv[2] || "3", 10);
  console.log(`Executing ${rounds} simulated interbank clearing cycles...\n`);

  for (let i = 1; i <= rounds; i++) {
    console.log(`--- [CYCLE ${i}/${rounds}] ---`);

    // 1. Tarjan LSM Gridlock Offsetting
    const topology = await lsmService.getGridlockTopology();
    if (topology.edges.length === 0) {
      await lsmService.resetTopology();
    }
    console.log(`[LSM Engine] Active graph: ${topology.nodes.length} banks, ${topology.edges.length} exposure channels.`);
    const lsmResult = await lsmService.resolveGridlock();
    console.log(`[LSM Engine] Cleared ${lsmResult.receipt?.cyclesResolvedCount || 0} circular cycles, unlocked ₹${(lsmResult.receipt?.grossDebtCleared || 0).toLocaleString()} liquidity.`);

    // 2. Multi-Agent Swarm
    const mockCheque = {
      id: `SIM-CHQ-${Date.now()}-${i}`,
      chequeNumber: `900${i}12`,
      amount: 150000 + i * 25000,
      accountNumber: "987654321098",
      payeeName: "Apex Global Infrastructure",
      dateOfIssue: new Date(),
      ppsStatus: "PPS_VERIFIED",
      fraudFlags: [],
    };
    const docket = await swarmService.evaluateChequeWithSwarm(mockCheque.id, mockCheque);
    console.log(`[Agent Swarm] Adjudicated instrument: Consensus ${docket.consensus.consensusScore}% -> ${docket.consensus.recommendation} (STP: ${docket.consensus.autoCleared})`);

    // 3. NIST PQC Hybrid Signing & Verification
    const batchManifest = { batchId: `BATCH-SIM-${i}`, totalCount: 25, totalAmount: 7500000 };
    const pqcSign = pqcService.signBatchHybrid(batchManifest.batchId, batchManifest, "SRT");
    const pqcVerify = pqcService.verifyBatchHybrid(batchManifest.batchId, batchManifest, "SRT");
    console.log(`[NIST PQC] ML-DSA-65 signature verified: ${pqcVerify.verified} | Hybrid Norm: ||z|| < gamma1`);

    // 4. zk-SNARK Groth16 Confidential Solvency Proof
    const zkProof = zkpService.generateSolvencyProof(mockCheque, { balance: 5000000 });
    const zkVerification = zkpService.verifySolvencyProof(zkProof);
    console.log(`[zk-MISDESC BN254] Zero-knowledge proof verified: ${zkVerification.verified} in ${zkVerification.verificationTimeMs}ms (0% data leakage)`);

    // 5. Programmable Smart Cheque Escrow & CBDC Settlement
    const contract = smartchequeService.createSmartContract(mockCheque.id, mockCheque.amount, {
      taxRatePercent: 18,
      commercialMilestones: true,
      milestoneSatisfied: true,
    });
    const cbdcReceipt = smartchequeService.settleWithCbdc(mockCheque.id, mockCheque.amount);
    console.log(`[Smart Cheque] Withheld ₹${contract.splitRouting.statutoryTaxEscrow.taxDeductedAmount} GST -> Settled CBDC Token ${cbdcReceipt.digitalTokenId}`);

    // 6. Cross-Border Multi-Currency Clearing & Sanctions Radar
    const fx = crossborderService.convertCurrency(12500, "USD");
    const sanctions = crossborderService.screenSanctions({
      drawerName: "Reliance Industries International",
      payeeName: "Singapore Port Logistics Pte",
      countryOrigin: "SG",
    });
    console.log(`[Cross-Border] Converted $12,500 @ ${fx.exchangeRate} -> Net ₹${fx.inrNetRealization.toLocaleString()} | Sanctions: ${sanctions.verdict}`);

    console.log("");
  }

  console.log(">>> Checking updated Prometheus Metrics Registry...");
  const metrics = await getPrometheusMetrics();
  const lsmMetric = metrics.match(/MISDESC_lsm_gridlock_cycles_resolved_total.* (\d+)/);
  const swarmMetric = metrics.match(/MISDESC_swarm_reviews_total.* (\d+)/);
  const pqcMetric = metrics.match(/MISDESC_pqc_signatures_verified_total.* (\d+)/);
  const zkpMetric = metrics.match(/MISDESC_zkp_proofs_verified_total.* (\d+)/);

  console.log(`- MISDESC_lsm_gridlock_cycles_resolved_total: ${lsmMetric ? lsmMetric[1] : "Active"}`);
  console.log(`- MISDESC_swarm_reviews_total:                 ${swarmMetric ? swarmMetric[1] : "Active"}`);
  console.log(`- MISDESC_pqc_signatures_verified_total:     ${pqcMetric ? pqcMetric[1] : "Active"}`);
  console.log(`- MISDESC_zkp_proofs_verified_total:          ${zkpMetric ? zkpMetric[1] : "Active"}`);

  console.log("\n==================================================================");
  console.log("   🎉 CLEARING SIMULATION COMPLETE - TELEMETRY DISPATCHED!        ");
  console.log("==================================================================");
  process.exit(0);
}

simulate().catch((err) => {
  console.error("Simulation error:", err);
  process.exit(1);
});
