const prisma = require("../config/prisma");
const { generatePacs008Xml, validateIso20022Xml } = require("../utils/iso20022.util");
const { broadcastEvent } = require("../utils/sse.util");
const { settlementCyclesTotal } = require("../utils/metrics.util");

// Runs a net settlement over all CLEARED cheques
async function runSettlement(req, res) {
  const clearedCheques = await prisma.cheque.findMany({
    where: { status: "CLEARED" },
    include: { presentingBank: true, draweeBank: true },
  });

  const net = {};

  for (const cheque of clearedCheques) {
    const from = cheque.draweeBankId;
    const to = cheque.presentingBankId;
    const key = [from, to].sort().join("::");

    if (!net[key]) {
      net[key] = { bankIds: [from, to].sort(), amount: 0 };
    }

    const sign = from === net[key].bankIds[0] ? 1 : -1;
    net[key].amount += sign * Number(cheque.amount);
  }

  const results = [];
  for (const { bankIds, amount } of Object.values(net)) {
    const [bankAId, bankBId] = bankIds;
    const direction = amount >= 0 ? "A_TO_B" : "B_TO_A";
    const netAmount = Math.abs(amount);

    const settlement = await prisma.settlement.create({
      data: { bankAId, bankBId, netAmount, direction },
    });
    results.push(settlement);
  }

  // Broadcast real-time SSE notification
  settlementCyclesTotal.inc({ mode: "MULTILATERAL_NET", status: "SUCCESS" });
  broadcastEvent("SETTLEMENT_RUN", {
    message: `Settlement cycle executed: ${results.length} net position(s) settled.`,
    settlementsCount: results.length,
    timestamp: new Date().toISOString(),
  });

  return res.status(201).json({
    message: `Settlement run complete. ${results.length} net position(s) calculated from ${clearedCheques.length} cleared cheque(s).`,
    settlements: results,
  });
}

async function listSettlements(req, res) {
  const settlements = await prisma.settlement.findMany({ orderBy: { createdAt: "desc" } });

  const bankIds = [...new Set(settlements.flatMap((s) => [s.bankAId, s.bankBId]))];
  const banks = await prisma.bank.findMany({ where: { id: { in: bankIds } } });
  const bankMap = Object.fromEntries(banks.map((b) => [b.id, b]));

  const enriched = settlements.map((s) => ({
    ...s,
    bankA: bankMap[s.bankAId],
    bankB: bankMap[s.bankBId],
  }));

  return res.json(enriched);
}

// Export pacs.008 XML for a settlement record
async function getSettlementIso20022(req, res) {
  const { id } = req.params;
  const settlement = await prisma.settlement.findUnique({ where: { id } });
  if (!settlement) return res.status(404).json({ error: "Settlement record not found" });

  const [bankA, bankB, cheques] = await Promise.all([
    prisma.bank.findUnique({ where: { id: settlement.bankAId } }),
    prisma.bank.findUnique({ where: { id: settlement.bankBId } }),
    prisma.cheque.findMany({
      where: {
        status: "CLEARED",
        OR: [
          { presentingBankId: settlement.bankAId, draweeBankId: settlement.bankBId },
          { presentingBankId: settlement.bankBId, draweeBankId: settlement.bankAId },
        ],
      },
      include: { presentingBank: true, draweeBank: true },
    }),
  ]);

  const xml = generatePacs008Xml({
    settlement: { ...settlement, bankA, bankB },
    cheques,
  });

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  return res.send(xml);
}

// Bank intraday central bank collateral allocation registry
const collateralRegistry = {
  SBIN0001234: {
    allocatedCollateral: 2500000, // ₹25,00,000 (25 Lakhs)
    clearingAccount: "RBI-SURAT-CA-0091823",
    intradayCreditFacility: 500000,
  },
  HDFC0005678: {
    allocatedCollateral: 3000000, // ₹30,00,000 (30 Lakhs)
    clearingAccount: "RBI-MUMBAI-CA-0082731",
    intradayCreditFacility: 1000000,
  },
};

// Real-time Liquidity Cap & Settlement Credit Limit Monitor
async function getLiquidityMonitor(req, res) {
  try {
    const banks = await prisma.bank.findMany();
    const cheques = await prisma.cheque.findMany({
      where: {
        status: { in: ["PRESENTED", "VERIFIED", "AWAITING_CHECKER", "CLEARED"] },
      },
      include: { presentingBank: true, draweeBank: true },
    });

    const bankExposures = banks.map((bank) => {
      const config = collateralRegistry[bank.ifsc] || {
        allocatedCollateral: 2500000,
        clearingAccount: `RBI-${bank.code}-CA-0001`,
        intradayCreditFacility: 500000,
      };

      // Inflow: cheques presented by this bank (funds to receive)
      const inflows = cheques
        .filter((c) => c.presentingBankId === bank.id)
        .reduce((sum, c) => sum + Number(c.amount), 0);

      // Outflow: cheques drawn on this bank (funds to pay out)
      const outflows = cheques
        .filter((c) => c.draweeBankId === bank.id)
        .reduce((sum, c) => sum + Number(c.amount), 0);

      const netPosition = inflows - outflows; // positive = net creditor, negative = net debtor
      const netDebitExposure = netPosition < 0 ? Math.abs(netPosition) : 0;
      const grossClearingVolume = outflows + inflows;

      // Collateral utilization percentage
      const utilizationPercent = Math.min(
        100,
        Math.round(((netDebitExposure > 0 ? netDebitExposure : outflows) / config.allocatedCollateral) * 1000) / 10
      );

      const isWarning = utilizationPercent >= 85;

      return {
        bankId: bank.id,
        bankName: bank.name,
        ifsc: bank.ifsc,
        code: bank.code,
        clearingAccount: config.clearingAccount,
        allocatedCollateral: config.allocatedCollateral,
        intradayCreditFacility: config.intradayCreditFacility,
        inflowAmount: inflows,
        outflowAmount: outflows,
        netPosition,
        netDebitExposure,
        grossClearingVolume,
        utilizationPercent,
        warningThresholdPercent: 85,
        liquidityWarning: isWarning,
        warningCode: isWarning ? "LIQUIDITY_WARNING" : "NORMAL",
        warningMessage: isWarning
          ? `LIQUIDITY_WARNING: Clearing debit exposure (${utilizationPercent}%) exceeds 85% collateral cap of ₹${config.allocatedCollateral.toLocaleString("en-IN")}. Intraday settlement cap alert triggered.`
          : `Liquidity stable. Intraday clearing buffer: ₹${(config.allocatedCollateral - (netDebitExposure || outflows)).toLocaleString("en-IN")}`,
      };
    });

    // Bilateral netting summary for SURAT PEOPLES CO OP BANK
    const bankA = banks.find((b) => b.ifsc === "SBIN0001234") || banks[0];
    const bankB = banks.find((b) => b.ifsc === "HDFC0005678") || banks[1];

    let bilateralNet = {
      pair: `${bankA?.name || "Bank A"} ↔ ${bankB?.name || "Bank B"}`,
      bankAExposure: bankExposures.find((b) => b.bankId === bankA?.id),
      bankBExposure: bankExposures.find((b) => b.bankId === bankB?.id),
      totalClearingVolume: cheques.reduce((acc, c) => acc + Number(c.amount), 0),
      totalInstrumentsCount: cheques.length,
      hasWarning: bankExposures.some((b) => b.liquidityWarning),
    };

    return res.json({
      timestamp: new Date().toISOString(),
      banks: bankExposures,
      bilateral: bilateralNet,
    });
  } catch (err) {
    console.error("Error in getLiquidityMonitor:", err);
    return res.status(500).json({ error: "Failed to calculate interbank liquidity monitor" });
  }
}

// Update collateral limit dynamically for stress testing & liquidity management
async function updateCollateralLimit(req, res) {
  try {
    const { ifsc, allocatedCollateral } = req.body;
    if (!ifsc || allocatedCollateral === undefined) {
      return res.status(400).json({ error: "ifsc and allocatedCollateral are required" });
    }

    if (!collateralRegistry[ifsc]) {
      collateralRegistry[ifsc] = {
        allocatedCollateral: Number(allocatedCollateral),
        clearingAccount: `RBI-${ifsc}-CA`,
        intradayCreditFacility: 500000,
      };
    } else {
      collateralRegistry[ifsc].allocatedCollateral = Number(allocatedCollateral);
    }

    // Broadcast SSE update for liquidity monitor
    broadcastEvent("LIQUIDITY_UPDATED", {
      ifsc,
      allocatedCollateral: Number(allocatedCollateral),
      timestamp: new Date().toISOString(),
    });

    return res.json({
      message: `Collateral cap for ${ifsc} updated to ₹${Number(allocatedCollateral).toLocaleString("en-IN")}`,
      registry: collateralRegistry[ifsc],
    });
  } catch (err) {
    console.error("Error updating collateral limit:", err);
    return res.status(500).json({ error: "Failed to update collateral limit" });
  }
}

// Continuous Clearing Engine State
const continuousClearingConfig = {
  enabled: true,
  rollingWindowMinutes: 15,
  currentWindowId: `WINDOW-T0-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-01`,
  windowStartedAt: new Date().toISOString(),
  mandate: "RBI Continuous Clearing Directive 2024-25 (T+0 On-Realisation)",
};

async function getContinuousSettlementStatus(req, res) {
  try {
    const settledCheques = await prisma.cheque.findMany({
      where: {
        status: "CLEARED",
        ekuberUtr: { not: null },
      },
      include: { presentingBank: true, draweeBank: true },
      orderBy: { settledAt: "desc" },
      take: 50,
    });

    const pendingCheques = await prisma.cheque.findMany({
      where: {
        status: "CLEARED",
        ekuberUtr: null,
      },
      include: { presentingBank: true, draweeBank: true },
    });

    const totalRealisedAmount = settledCheques.reduce((sum, c) => sum + Number(c.amount), 0);

    return res.json({
      config: continuousClearingConfig,
      stats: {
        realisedCount: settledCheques.length,
        totalRealisedAmount,
        pendingSettlementCount: pendingCheques.length,
      },
      settledCheques,
      pendingCheques,
    });
  } catch (err) {
    console.error("Error fetching continuous settlement status:", err);
    return res.status(500).json({ error: "Failed to fetch continuous settlement status" });
  }
}

async function toggleContinuousMode(req, res) {
  const { enabled } = req.body;
  continuousClearingConfig.enabled = Boolean(enabled);
  broadcastEvent("CONTINUOUS_MODE_CHANGED", continuousClearingConfig);
  return res.json({
    message: `Continuous Clearing mode is now ${continuousClearingConfig.enabled ? "ENABLED (T+0 On-Realisation)" : "DISABLED (Legacy Batch T+1)"}`,
    config: continuousClearingConfig,
  });
}

async function settleChequeEkuber(req, res) {
  try {
    const { chequeId } = req.params;
    const cheque = await prisma.cheque.findUnique({
      where: { id: chequeId },
      include: { presentingBank: true, draweeBank: true },
    });

    if (!cheque) return res.status(404).json({ error: "Cheque not found" });
    if (cheque.status !== "CLEARED") {
      return res.status(400).json({ error: "Only CLEARED cheques can be settled via RBI e-Kuber" });
    }

    const { executeContinuousRealization } = require("../utils/ekuber.util");
    const realization = executeContinuousRealization({
      cheque,
      presentingBank: cheque.presentingBank,
      draweeBank: cheque.draweeBank,
    });

    const updated = await prisma.cheque.update({
      where: { id: chequeId },
      data: {
        ekuberUtr: realization.utr,
        ekuberRef: realization.ekuberRef,
        settledAt: realization.settledAt,
        settlementMode: "CONTINUOUS_T0",
        beneficiaryCreditStatus: "CREDITED_INSTANT",
      },
      include: { presentingBank: true, draweeBank: true },
    });

    const { recordChainedEvent } = require("../utils/ledger.util");
    await recordChainedEvent({
      chequeId: cheque.id,
      fromStatus: "CLEARED",
      toStatus: "CLEARED",
      remarks: `Manual e-Kuber On-Realisation Settlement Triggered · UTR: ${realization.utr} · Ref: ${realization.ekuberRef}`,
      actorId: req.user.id,
    });

    broadcastEvent("EKUBER_SETTLEMENT_CONFIRMED", {
      chequeId: updated.id,
      chequeNumber: updated.chequeNumber,
      amount: updated.amount,
      utr: realization.utr,
      ekuberRef: realization.ekuberRef,
      settledAt: realization.settledAt,
      beneficiaryCreditStatus: "CREDITED_INSTANT",
      presentingBank: updated.presentingBank?.name,
      draweeBank: updated.draweeBank?.name,
    });

    return res.json({
      message: `e-Kuber On-Realisation Settlement executed successfully for Cheque #${cheque.chequeNumber}`,
      cheque: updated,
      realization,
    });
  } catch (err) {
    console.error("e-Kuber realization failed:", err);
    return res.status(500).json({ error: "Failed to execute e-Kuber settlement" });
  }
}

async function getEkuberPacs009Xml(req, res) {
  try {
    const { id } = req.params;
    const cheque = await prisma.cheque.findUnique({
      where: { id },
      include: { presentingBank: true, draweeBank: true },
    });

    if (!cheque) return res.status(404).json({ error: "Cheque not found" });
    if (!cheque.ekuberUtr) {
      return res.status(400).json({ error: "Cheque has not yet been settled via RBI e-Kuber" });
    }

    const { generatePacs009Xml } = require("../utils/ekuber.util");
    const xml = generatePacs009Xml({
      settlementRef: cheque.ekuberRef || `EKUBER/MISDESC3/REF-${cheque.id.slice(0, 8)}`,
      utr: cheque.ekuberUtr,
      cheque,
      presentingBank: cheque.presentingBank,
      draweeBank: cheque.draweeBank,
      settledAt: cheque.settledAt,
    });

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.send(xml);
  } catch (err) {
    console.error("Error generating pacs.009 XML:", err);
    return res.status(500).json({ error: "Failed to generate pacs.009 XML" });
  }
}

// Live Schematron & XSD conformance validator
async function validateSettlementIso20022(req, res) {
  try {
    const { xml } = req.body;
    if (!xml) return res.status(400).json({ error: "Missing XML document payload" });
    const result = validateIso20022Xml(xml);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Validation failure: " + err.message });
  }
}

module.exports = {
  runSettlement,
  listSettlements,
  getSettlementIso20022,
  validateSettlementIso20022,
  getLiquidityMonitor,
  updateCollateralLimit,
  getContinuousSettlementStatus,
  toggleContinuousMode,
  settleChequeEkuber,
  getEkuberPacs009Xml,
};
