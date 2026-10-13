const client = require("prom-client");
const os = require("os");

// Create custom Prometheus registry
const register = new client.Registry();

// Enable standard Node.js runtime and OS metrics
client.collectDefaultMetrics({
  register,
  prefix: "MISDESC_node_",
});

// 1. HTTP Request Metrics
const httpRequestsTotal = new client.Counter({
  name: "MISDESC_http_requests_total",
  help: "Total count of HTTP requests processed by MISDESC backend API",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: "MISDESC_http_request_duration_seconds",
  help: "Histogram of HTTP request latencies in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// 2. Cheque Processing & Clearing Velocity Metrics
const chequesPresentedTotal = new client.Counter({
  name: "MISDESC_cheques_presented_total",
  help: "Total number of cheques presented into the clearing grid",
  labelNames: ["presenting_bank", "risk_tier"],
  registers: [register],
});

const chequesClearedTotal = new client.Counter({
  name: "MISDESC_cheques_cleared_total",
  help: "Total number of cheques cleared by Drawee banks",
  labelNames: ["drawee_bank", "settlement_mode"],
  registers: [register],
});

// 3. RBI e-Kuber Continuous Realization & Settlement Volume Metrics
const ekuberRealizationsTotal = new client.Counter({
  name: "MISDESC_ekuber_realizations_total",
  help: "Total number of real-time On-Realisation transactions dispatched to RBI e-Kuber",
  labelNames: ["status", "drawee_bank", "presenting_bank"],
  registers: [register],
});

const settlementVolumeInrTotal = new client.Counter({
  name: "MISDESC_settlement_volume_inr_total",
  help: "Cumulative gross cleared settlement volume in INR",
  labelNames: ["direction", "creditor_bank", "debtor_bank"],
  registers: [register],
});

// 4. Positive Pay System (PPS) Fraud Defense Metrics
const ppsVerificationTotal = new client.Counter({
  name: "MISDESC_pps_verification_total",
  help: "Total count of automated Positive Pay System 5-point reconciliations",
  labelNames: ["result"], // PPS_VERIFIED, PPS_MISMATCH, PPS_NOT_REGISTERED, PPS_NOT_APPLICABLE
  registers: [register],
});

// 5. Central Bank Intraday Collateral Utilization Ratio (0.0 to 1.0)
const liquidityUtilizationRatio = new client.Gauge({
  name: "MISDESC_liquidity_utilization_ratio",
  help: "Current intraday debit exposure vs allocated collateral ratio (>=0.85 trips warning)",
  labelNames: ["bank_code"],
  registers: [register],
});

// Function to return Prometheus formatted metrics string
async function getPrometheusMetrics() {
  return await register.metrics();
}

// In-memory request counters for SRE dashboard
let totalRequests = 0;
let totalErrors = 0;
const latencySamples = [];
const startTime = Date.now();

function recordRequestMetrics(method, route, statusCode, durationMs) {
  totalRequests++;
  if (statusCode >= 400) totalErrors++;
  latencySamples.push(durationMs);
  if (latencySamples.length > 500) latencySamples.shift();

  try {
    httpRequestsTotal.inc({ method, route: route || "unknown", status_code: String(statusCode) });
    httpRequestDurationSeconds.observe(
      { method, route: route || "unknown", status_code: String(statusCode) },
      durationMs / 1000
    );
  } catch (err) {
    // Ignore metric recording errors in edge cases
  }
}

// Gather SRE & Observability JSON stats for Frontend Hub
async function getSreStats() {
  const sorted = [...latencySamples].sort((a, b) => a - b);
  const p50 = sorted.length ? sorted[Math.floor(sorted.length * 0.5)] : 0;
  const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;
  const p99 = sorted.length ? sorted[Math.floor(sorted.length * 0.99)] : 0;
  const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;

  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const mem = process.memoryUsage();

  return {
    uptimeSeconds,
    requests: {
      total: totalRequests,
      errors: totalErrors,
      errorRate: totalRequests > 0 ? Number(((totalErrors / totalRequests) * 100).toFixed(2)) : 0,
    },
    latency: {
      avgMs: Number(avg.toFixed(2)),
      p50Ms: Number(p50.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      p99Ms: Number(p99.toFixed(2)),
    },
    system: {
      memoryUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
      memoryTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
      rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
      cpuCount: os.cpus().length,
      loadAvg: os.loadavg(),
    },
  };
}

function recordRequest({ method, path, statusCode, durationMs }) {
  recordRequestMetrics(method, path, statusCode, durationMs);
}

// 6. Multi-Role Enterprise Operational Metrics
const branchManagerOverridesTotal = new client.Counter({
  name: "MISDESC_branch_manager_overrides_total",
  help: "Total high-value instruments counter-signed and approved by Branch Managers",
  labelNames: ["branch", "action"],
  registers: [register],
});

const auditVerificationsTotal = new client.Counter({
  name: "MISDESC_audit_verifications_total",
  help: "Total cryptographic ledger verifications performed by Compliance Auditors",
  labelNames: ["auditor", "status"],
  registers: [register],
});

const settlementCyclesTotal = new client.Counter({
  name: "MISDESC_settlement_cycles_total",
  help: "Total e-Kuber multilateral net settlement cycles executed by Settlement Officers",
  labelNames: ["mode", "status"],
  registers: [register],
});

const itChaosEventsTotal = new client.Counter({
  name: "MISDESC_it_chaos_events_total",
  help: "Total chaos simulations injected or reset by IT Staff",
  labelNames: ["type", "user"],
  registers: [register],
});

const disputesFiledTotal = new client.Counter({
  name: "MISDESC_disputes_filed_total",
  help: "Total clearing dispute claims registered under NPCI MISDESC DRM framework",
  labelNames: ["dispute_type", "initiating_bank"],
  registers: [register],
});

const pkiSignaturesVerifiedTotal = new client.Counter({
  name: "MISDESC_pki_signatures_verified_total",
  help: "Total X.509 PKI digital signatures verified on clearing manifests",
  labelNames: ["status"],
  registers: [register],
});

// 7. Phase 1: Tarjan Intraday Liquidity Savings Mechanism (LSM)
const lsmCyclesResolvedTotal = new client.Counter({
  name: "MISDESC_lsm_gridlock_cycles_resolved_total",
  help: "Total Tarjan strongly connected components / gridlock cycles cleared by LSM",
  labelNames: ["algorithm"], // tarjan_scc, bilateral_fifo
  registers: [register],
});

const lsmLiquidityUnlockedInrTotal = new client.Counter({
  name: "MISDESC_lsm_liquidity_unlocked_inr_total",
  help: "Total cumulative liquidity savings unlocked via multilateral netting in INR",
  labelNames: ["batch_type"],
  registers: [register],
});

// 8. Phase 2: Autonomous Multi-Agent Swarm Adjudication
const swarmReviewsTotal = new client.Counter({
  name: "MISDESC_swarm_reviews_total",
  help: "Total instruments audited by the autonomous 4-agent swarm adjudication engine",
  labelNames: ["verdict", "risk_band"], // CLEAR_STP, MANUAL_REVIEW_RECOMMENDED, REJECT_FLAG
  registers: [register],
});

const swarmStpClearedTotal = new client.Counter({
  name: "MISDESC_swarm_stp_cleared_total",
  help: "Total cheques straight-through-processed (STP) with high agent consensus",
  labelNames: ["agent_consensus"], // UNANIMOUS, MAJORITY, SPLIT
  registers: [register],
});

// 9. Phase 3: NIST FIPS 204 Post-Quantum Cryptography (PQC)
const pqcSignaturesVerifiedTotal = new client.Counter({
  name: "MISDESC_pqc_signatures_verified_total",
  help: "Total quantum-resistant ML-DSA / Dilithium signatures verified on clearing manifests",
  labelNames: ["algorithm", "status"], // ML-DSA-87, FALCON-512, SPHINCS+
  registers: [register],
});

const pqcKeyExchangesTotal = new client.Counter({
  name: "MISDESC_pqc_key_exchanges_total",
  help: "Total ML-KEM Kyber-1024 quantum-safe encapsulated session exchanges",
  labelNames: ["status"],
  registers: [register],
});

// 10. Option 1: Zero-Knowledge Confidential Clearing (zk-MISDESC)
const zkpProofsVerifiedTotal = new client.Counter({
  name: "MISDESC_zkp_proofs_verified_total",
  help: "Total zk-SNARK Groth16 / BN254 zero-knowledge solvency proofs verified",
  labelNames: ["circuit", "result"], // SolvencyAndSignatureCircuit, VALID, INVALID
  registers: [register],
});

// 11. Option 2: Programmable Smart Cheques & CBDC (e-Rupee) Bridge
const smartChequeContraMISDESCTotal = new client.Counter({
  name: "MISDESC_smart_cheque_contraMISDESC_total",
  help: "Total programmable smart cheque escrow agreements created and executed",
  labelNames: ["condition_type", "state"], // MILESTONE_ORACLE, TIME_LOCKED, RELEASED, REFUNDED
  registers: [register],
});

const cbdcSettlementsTotal = new client.Counter({
  name: "MISDESC_cbdc_settlements_total",
  help: "Total atomic DvP settlements finalized on RBI Digital Rupee (e₹) CBDC ledger",
  labelNames: ["status", "denom"], // SUCCESS, FAILURE, eINR
  registers: [register],
});

// 12. Option 3: Cross-Border Multi-Currency Clearing & Sanctions Radar
const crossborderFxVolumeTotal = new client.Counter({
  name: "MISDESC_crossborder_fx_volume_usd_total",
  help: "Cumulative cross-border international draft clearing volume converted to USD",
  labelNames: ["source_currency", "target_currency"],
  registers: [register],
});

const sanctionsScreenedTotal = new client.Counter({
  name: "MISDESC_sanctions_screened_total",
  help: "Total international clearing transactions screened against OFAC / UN / RBI Sanctions list",
  labelNames: ["verdict"], // PASS, BLOCKED, REVIEW
  registers: [register],
});

module.exports = {
  register,
  getPrometheusMetrics,
  getSreStats,
  recordRequestMetrics,
  recordRequest,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  chequesPresentedTotal,
  chequesClearedTotal,
  ekuberRealizationsTotal,
  settlementVolumeInrTotal,
  ppsVerificationTotal,
  liquidityUtilizationRatio,
  branchManagerOverridesTotal,
  auditVerificationsTotal,
  settlementCyclesTotal,
  itChaosEventsTotal,
  disputesFiledTotal,
  pkiSignaturesVerifiedTotal,
  // Advanced Fintech Engine Metrics
  lsmCyclesResolvedTotal,
  lsmLiquidityUnlockedInrTotal,
  swarmReviewsTotal,
  swarmStpClearedTotal,
  pqcSignaturesVerifiedTotal,
  pqcKeyExchangesTotal,
  zkpProofsVerifiedTotal,
  smartChequeContraMISDESCTotal,
  cbdcSettlementsTotal,
  crossborderFxVolumeTotal,
  sanctionsScreenedTotal,
};
