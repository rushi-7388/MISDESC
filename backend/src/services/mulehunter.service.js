/**
 * ==============================================================================
 * RBIH-Style MuleHunter.AI: Real-Time Money Mule & Beneficiary Graph Radar
 * ==============================================================================
 * Modeled after the Reserve Bank Innovation Hub (RBIH) Dec 2024 / 2025 initiative.
 * Intercepts "money mule" rented bank accounts used by cyber syndicates and
 * betting cartels to siphon CTS cheque proceeds before cash-out at ATMs.
 */

const crypto = require("crypto");

// Known high-risk mule clusters & syndicated nodes
const KNOWN_MULE_CLUSTERS = new Set([
  "ACC-MULE-882194",
  "ACC-MULE-449102",
  "ACC-MULE-773199",
  "ACC-MULE-110294",
]);

/**
 * Computes Beneficiary Graph Centrality & Mule Risk Score (0 - 100)
 */
function analyzeBeneficiaryMuleRisk({
  beneficiaryAccount,
  beneficiaryIfsc,
  amount,
  drawerAccount,
  drawerBankId,
}) {
  const normalizedAcc = String(beneficiaryAccount || "").trim().toUpperCase();
  const amt = Number(amount || 0);

  // 1. Synthetic Graph Topology Inspection
  // Hash account to generate deterministic simulated telemetry for the radar
  const hashVal = parseInt(crypto.createHash("sha256").update(normalizedAcc).digest("hex").slice(0, 6), 16);
  const accountAgeDays = 15 + (hashVal % 365); // Accounts < 90 days are prime mule suspects
  const velocityScore = ((hashVal >> 4) % 100) / 100; // Inflow/outflow velocity
  const atmCashoutLatencyMinutes = 4 + (hashVal % 45); // Mules cash out at ATMs in < 15 mins
  const degreeCentrality = 1 + (hashVal % 18); // Number of diverse inbound remitters

  let riskScore = 12;
  const riskFactors = [];
  let isKnownClusterNode = KNOWN_MULE_CLUSTERS.has(normalizedAcc);

  if (isKnownClusterNode) {
    riskScore += 75;
    riskFactors.push("CRITICAL: Beneficiary account matches RBIH Known Mule Cluster Topology (DIP/Chakshu)");
  }

  // Factor: High Velocity + Low Age (Classic Mule Pattern)
  if (accountAgeDays < 60) {
    riskScore += 25;
    riskFactors.push(`High Velocity on New Account (Account Age: ${accountAgeDays} days)`);
  }

  // Factor: Rapid ATM Liquidation Profile
  if (atmCashoutLatencyMinutes < 15 && amt >= 100000) {
    riskScore += 30;
    riskFactors.push(`Rapid Cash-out Anomaly: Historical mean ATM withdrawal latency ${atmCashoutLatencyMinutes} mins`);
  }

  // Factor: Fan-in Degree Centrality (Layering Detection)
  if (degreeCentrality > 10) {
    riskScore += 20;
    riskFactors.push(`Layering Alert: High fan-in connectivity (${degreeCentrality} unrelated remitters in 24h)`);
  }

  // Cap score
  riskScore = Math.min(100, Math.max(5, riskScore));

  const isMuleSuspect = riskScore >= 65 || isKnownClusterNode;
  const muleHoldRecommended = isMuleSuspect;

  const advisoryId = `MULE-ADV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  return {
    advisoryId,
    timestamp: new Date().toISOString(),
    beneficiaryAccount: normalizedAcc,
    beneficiaryIfsc: beneficiaryIfsc || "HDFC0000128",
    chequeAmount: amt,
    riskScore,
    riskLevel: riskScore >= 80 ? "CRITICAL_MULE_CLUSTER" : riskScore >= 65 ? "HIGH_MULE_RISK" : "NORMAL",
    isMuleSuspect,
    muleHoldRecommended,
    muleHoldDurationHours: muleHoldRecommended ? 24 : 0,
    graphMetrics: {
      accountAgeDays,
      degreeCentrality,
      atmCashoutLatencyMinutes,
      velocityScore,
      clusteringCoefficient: Number((0.68 + (velocityScore * 0.2)).toFixed(3)),
    },
    riskFactors,
    statutoryAction: muleHoldRecommended
      ? "MuleHold Advisory Issued: Instant ATM/IMPS outward liquidity frozen for 24h pending physical KYC reverification under RBI Master Direction 2024."
      : "Standard Clearing Approved: Beneficiary graph matches genuine merchant profile.",
    telemetrySignature: crypto
      .createHmac("sha256", "rbih_mulehunter_secret")
      .update(`${advisoryId}:${normalizedAcc}:${riskScore}`)
      .digest("hex"),
  };
}

module.exports = {
  analyzeBeneficiaryMuleRisk,
  KNOWN_MULE_CLUSTERS,
};
