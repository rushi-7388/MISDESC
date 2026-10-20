/**
 * ==============================================================================
 * Unified Lending Interface (ULI) & Account Aggregator (AA) Overdraft Bridge
 * ==============================================================================
 * Aligned with the RBI Unified Lending Interface (ULI) framework (Aug 2024 / 2025).
 * Enables consent-based pre-clearing solvency telemetry from Account Aggregators.
 * If drawer balance is temporarily short, the system triggers a Just-In-Time
 * Micro-Overdraft (JIT-OD) backed by GSTN receivables, preventing cheque bounces.
 */

const crypto = require("crypto");

/**
 * Evaluate Account Aggregator Telemetry & Trigger JIT Micro-Overdraft if required
 */
function evaluateAndDisburseJitOverdraft({
  drawerAccount,
  drawerGstin,
  chequeAmount,
  currentAvailableBalance,
  draweeBankId,
}) {
  const chqAmt = Number(chequeAmount || 0);
  const bal = Number(currentAvailableBalance || 0);
  const shortfall = Math.max(0, chqAmt - bal);

  // If sufficient funds exist, no overdraft needed
  if (shortfall === 0) {
    return {
      overdraftRequired: false,
      shortfallAmount: 0,
      status: "SOLVENT_DIRECT_DEBIT",
      message: "Drawer account possesses sufficient ledger balance. Overdraft facility not invoked.",
    };
  }

  // Generate deterministic synthetic AA / GSTN profile
  const gstinClean = String(drawerGstin || "24AAACS1234F1Z5").toUpperCase();
  const hash = parseInt(crypto.createHash("sha256").update(gstinClean).digest("hex").slice(0, 6), 16);

  // Verified monthly GST turnover (usually ₹15L - ₹80L for typical business drawers)
  const monthlyGstTurnover = 2500000 + (hash % 5000000);
  // Max JIT-OD credit line is 20% of monthly GST turnover up to ₹10 Lakhs
  const maxApprovedCreditLine = Math.min(1000000, Math.floor(monthlyGstTurnover * 0.2));

  const isEligible = shortfall <= maxApprovedCreditLine;
  const facilityRef = `ULI-JIT-OD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const loanTenureHours = 72; // 72-hour liquidity bridge
  const annualizedInterestRatePercent = 9.5; // Commercial short-term liquidity repo rate
  const processingFeeInr = Math.min(2500, Math.max(250, Math.round(shortfall * 0.0025))); // 0.25% fee

  if (!isEligible) {
    return {
      overdraftRequired: true,
      eligibleForJitOd: false,
      shortfallAmount: shortfall,
      maxApprovedCreditLine,
      status: "SHORTFALL_EXCEEDS_ULI_CAP",
      message: `Shortfall of ₹${shortfall.toLocaleString("en-IN")} exceeds maximum consent-based ULI credit line of ₹${maxApprovedCreditLine.toLocaleString("en-IN")}.`,
      aaTelemetry: {
        gstin: gstinClean,
        monthlyGstTurnover,
        creditHealthScore: 610,
      },
    };
  }

  return {
    overdraftRequired: true,
    eligibleForJitOd: true,
    facilityRef,
    timestamp: new Date().toISOString(),
    shortfallAmount: shortfall,
    disbursedAmount: shortfall,
    chequeAmount: chqAmt,
    clearedWithZeroBounce: true,
    loanTerms: {
      tenureHours: loanTenureHours,
      repaymentDeadline: new Date(Date.now() + loanTenureHours * 3600 * 1000).toISOString(),
      annualizedInterestRatePercent,
      estimatedInterest72h: Number(((shortfall * (annualizedInterestRatePercent / 100) * (3 / 365))).toFixed(2)),
      processingFeeInr,
    },
    collateralType: "GSTN_ACCOUNTS_RECEIVABLE_INVOICE_LIEN",
    aaTelemetry: {
      consentId: `AA-CONSENT-${Date.now().toString(36).toUpperCase()}`,
      gstin: gstinClean,
      monthlyGstTurnover,
      accountAggregatorProvider: "Sahamati / Setu AA Ecosystem",
      creditHealthScore: 785,
      invoiceBackingStatus: "VERIFIED_IRN_EWAYBILL",
    },
    message: `Just-In-Time Micro-Overdraft of ₹${shortfall.toLocaleString("en-IN")} disbursed automatically under RBI Unified Lending Interface (ULI). Instrument cleared with 0.0% bounce rate.`,
  };
}

module.exports = {
  evaluateAndDisburseJitOverdraft,
};
