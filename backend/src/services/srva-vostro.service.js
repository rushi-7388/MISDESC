/**
 * ==============================================================================
 * Special Rupee Vostro Account (SRVA) Bilateral Settlement Bridge
 * ==============================================================================
 * Governed by RBI Circular on International Trade Settlement in Indian Rupees (INR)
 * via Special Rupee Vostro Accounts (SRVA). Enables multinational cheques drawn
 * in AED, SGD, SAR, EUR to settle directly in Rupee ledger balances without SWIFT.
 */

const crypto = require("crypto");

// Active RBI-Approved Special Rupee Vostro Accounts (SRVA)
const VOSTRO_ACCOUNTS = {
  "EMIRATES-NBD-SRVA": {
    country: "United Arab Emirates",
    partnerBank: "Emirates NBD PJSC (Dubai)",
    currency: "AED",
    fxRateToInr: 22.88, // 1 AED = ~22.88 INR
    currentVostroBalanceInr: 450000000, // ₹45 Crores
    clearingAccount: "SRVA-IN-HDFC-AED-001",
  },
  "DBS-SINGAPORE-SRVA": {
    country: "Singapore",
    partnerBank: "DBS Bank Ltd (Singapore)",
    currency: "SGD",
    fxRateToInr: 63.45, // 1 SGD = ~63.45 INR
    currentVostroBalanceInr: 280000000, // ₹28 Crores
    clearingAccount: "SRVA-IN-SBI-SGD-002",
  },
  "AL-RAJHI-SRVA": {
    country: "Saudi Arabia",
    partnerBank: "Al Rajhi Banking & Investment Corp (Riyadh)",
    currency: "SAR",
    fxRateToInr: 22.42, // 1 SAR = ~22.42 INR
    currentVostroBalanceInr: 190000000, // ₹19 Crores
    clearingAccount: "SRVA-IN-SNB-SAR-003",
  },
};

/**
 * Execute Bilateral Rupee Vostro DvP Settlement
 */
function settleViaVostroAccount({
  vostroAccountId = "EMIRATES-NBD-SRVA",
  foreignCurrencyAmount,
  chequeNumber,
  beneficiaryAccount,
  beneficiaryIfsc,
}) {
  const account = VOSTRO_ACCOUNTS[vostroAccountId] || VOSTRO_ACCOUNTS["EMIRATES-NBD-SRVA"];
  const foreignAmt = Number(foreignCurrencyAmount || 0);
  const settledInrAmount = Math.round(foreignAmt * account.fxRateToInr);

  // Check liquidity in the Vostro balance
  if (account.currentVostroBalanceInr < settledInrAmount) {
    return {
      success: false,
      error: `Insufficient liquidity in ${account.partnerBank} SRVA. Balance: ₹${account.currentVostroBalanceInr.toLocaleString("en-IN")}, Required: ₹${settledInrAmount.toLocaleString("en-IN")}`,
    };
  }

  // Deduct from Vostro Ledger
  account.currentVostroBalanceInr -= settledInrAmount;

  const srvaUtr = `SRVA${Date.now().toString().slice(-8)}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const isoPacs009MsgId = `IN-SRVA-CBPR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  return {
    success: true,
    vostroAccountId,
    partnerBank: account.partnerBank,
    country: account.country,
    foreignCurrency: account.currency,
    foreignAmount: foreignAmt,
    fxRateApplied: account.fxRateToInr,
    settledInrAmount,
    srvaUtr,
    isoPacs009MsgId,
    timestamp: new Date().toISOString(),
    remainingVostroBalanceInr: account.currentVostroBalanceInr,
    settlementMode: "BILATERAL_RUPEE_VOSTRO_DVP",
    swiftBypassSavingsPercent: 3.5, // 350 bps saved compared to traditional SWIFT intermediary routing
    statutoryCompliance: "RBI Circular A.P. (DIR Series) No. 10 - International Trade Settlement in INR",
    auditRecord: {
      beneficiaryAccount,
      beneficiaryIfsc,
      chequeNumber,
      creditedInstantly: true,
    },
  };
}

module.exports = {
  VOSTRO_ACCOUNTS,
  settleViaVostroAccount,
};
