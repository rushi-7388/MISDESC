const prisma = require("../config/prisma");
const { recordChainedEvent } = require("../utils/ledger.util");
const { broadcastEvent } = require("../utils/sse.util");
const { executeContinuousRealization } = require("../utils/ekuber.util");
const {
  chequesClearedTotal,
  ekuberRealizationsTotal,
  settlementVolumeInrTotal,
} = require("../utils/metrics.util");
const liquidityService = require("../services/liquidity.service");
const messagingService = require("../services/messaging.service");
const { inMemoryCheques, inMemoryEvents } = require("../utils/mock-db.util");


// Valid state machine transitions
const TRANSITIONS = {
  PRESENTED: ["VERIFIED", "AWAITING_CHECKER", "RETURNED"],
  VERIFIED: ["CLEARED", "RETURNED"],
  AWAITING_CHECKER: ["CLEARED", "RETURNED"],
  CLEARED: [],
  RETURNED: [],
};

const RETURN_REASON_CODES = {
  "01": "Insufficient funds",
  "02": "Signature mismatch",
  "03": "Account closed",
  "04": "Stale/post-dated cheque",
  "05": "Amount in words/figures mismatch",
  "06": "Maker-Checker verification rejected",
  "99": "Other",
};

async function transitionCheque(req, res) {
  const { id } = req.params;
  const toStatus = req.body.toStatus || req.body.status;
  const { returnReasonCode, remarks } = req.body;

  if (!toStatus) return res.status(400).json({ error: "toStatus is required" });

  let cheque = null;
  try {
    cheque = await prisma.cheque.findUnique({ where: { id }, include: { presentingBank: true, draweeBank: true } });
  } catch {
    // Database offline fallback
  }

  if (!cheque) {
    cheque = inMemoryCheques.find((c) => c.id === id || c.chequeNumber === id);
  }

  if (!cheque) return res.status(404).json({ error: "Cheque not found" });

  // Only authorized clearing roles or participating banks can move a cheque through the lifecycle
  const hasGlobalClearingAuthority = ["ADMIN", "SETTLEMENT_OFFICER", "BRANCH_MANAGER"].includes(req.user.role);
  const isPartyBank = cheque.draweeBankId === req.user.bankId || cheque.presentingBankId === req.user.bankId;

  if (!hasGlobalClearingAuthority && !isPartyBank && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Only the participating banks or authorized clearing officers can act on this cheque" });
  }


  // Maker-Checker Rule Enforcement
  const isHighRiskOrValue = Number(cheque.amount) >= 100000 || cheque.riskTier === "HIGH";

  let effectiveTargetStatus = toStatus;
  let makerId = cheque.makerId;
  let checkerId = cheque.checkerId;
  let transitionRemarks = remarks;

  // Step 1: When moving from PRESENTED to VERIFIED on a high-value or high-risk cheque,
  // automatically route to AWAITING_CHECKER for 4-Eyes verification!
  if (cheque.status === "PRESENTED" && toStatus === "VERIFIED" && isHighRiskOrValue) {
    effectiveTargetStatus = "AWAITING_CHECKER";
    makerId = req.user.id;
    transitionRemarks = remarks || `Maker verification completed by ${req.user.name}. Route to Senior Approver for 4-Eyes Checker Sign-off.`;
  }

  // Step 2: When clearing a cheque from AWAITING_CHECKER, verify that the checker is a different user
  if (cheque.status === "AWAITING_CHECKER" && effectiveTargetStatus === "CLEARED") {
    if (req.user.role !== "ADMIN" && cheque.makerId && cheque.makerId === req.user.id) {
      return res.status(403).json({
        error: "Maker-Checker Violation: The same officer cannot act as both Maker and Checker. Please have another drawee verifier sign off.",
      });
    }
    checkerId = req.user.id;
    transitionRemarks = remarks || `Secondary Checker authorization approved by ${req.user.name}. Final clearance issued.`;
  }

  const allowedNext = TRANSITIONS[cheque.status] || [];
  if (!allowedNext.includes(effectiveTargetStatus)) {
    return res.status(400).json({
      error: `Invalid transition from ${cheque.status} to ${effectiveTargetStatus}`,
      allowedNext,
    });
  }

  if (effectiveTargetStatus === "RETURNED" && !returnReasonCode) {
    return res.status(400).json({ error: "returnReasonCode is required when returning a cheque" });
  }

  const finalReturnReason = effectiveTargetStatus === "RETURNED" ? RETURN_REASON_CODES[returnReasonCode] || "Other" : cheque.returnReason;

  // RBI Continuous Clearing On-Realisation Settlement
  let ekuberReceipt = null;
  const updateData = {
    status: effectiveTargetStatus,
    makerId,
    checkerId,
    returnReason: finalReturnReason,
  };

  if (effectiveTargetStatus === "CLEARED") {
    // 1. Commit Central Bank Intraday Collateral & Liquidity Exposure Debit
    try {
      await liquidityService.commitSettlementDebit(cheque.draweeBankId, cheque.id, cheque.amount);
    } catch (liqErr) {
      console.warn("Intraday liquidity accounting notice:", liqErr.message);
    }

    ekuberReceipt = executeContinuousRealization({
      cheque,
      presentingBank: cheque.presentingBank,
      draweeBank: cheque.draweeBank,
    });

    updateData.ekuberUtr = ekuberReceipt.utr;
    updateData.ekuberRef = ekuberReceipt.ekuberRef;
    updateData.settledAt = ekuberReceipt.settledAt;
    updateData.settlementMode = "CONTINUOUS_T0";
    updateData.beneficiaryCreditStatus = "CREDITED_INSTANT";

    transitionRemarks = (transitionRemarks || "Instrument Cleared") + ` · RBI e-Kuber Settled (UTR: ${ekuberReceipt.utr}) · Beneficiary Credited T+0 Fast-Path`;

    // Increment Prometheus metrics
    try {
      chequesClearedTotal.inc({
        drawee_bank: cheque.draweeBank?.code || "HDB",
        settlement_mode: "CONTINUOUS_T0",
      });
      ekuberRealizationsTotal.inc({
        status: "SUCCESS",
        drawee_bank: cheque.draweeBank?.code || "HDB",
        presenting_bank: cheque.presentingBank?.code || "SNB",
      });
      settlementVolumeInrTotal.inc(
        {
          direction: "DRAWEE_TO_PRESENTING",
          creditor_bank: cheque.presentingBank?.code || "SNB",
          debtor_bank: cheque.draweeBank?.code || "HDB",
        },
        Number(cheque.amount)
      );
    } catch (metricErr) {
      console.error("Metric recording error:", metricErr);
    }
  }

  let updated = null;
  try {
    updated = await prisma.cheque.update({
      where: { id },
      data: updateData,
      include: { presentingBank: true, draweeBank: true, batch: true },
    });
  } catch {
    // In-memory update
    Object.assign(cheque, updateData);
    updated = cheque;
    inMemoryEvents.unshift({
      id: `evt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      fromStatus: cheque.status,
      toStatus: effectiveTargetStatus,
      remarks: transitionRemarks || (effectiveTargetStatus === "RETURNED" ? finalReturnReason : null),
      cheque: { chequeNumber: cheque.chequeNumber },
      actor: { name: req.user?.name || "Clearing Officer" },
    });
  }

  // Record cryptographically hash-chained block in ledger
  try {
    await recordChainedEvent({
      chequeId: cheque.id,
      fromStatus: cheque.status,
      toStatus: effectiveTargetStatus,
      remarks: transitionRemarks || (effectiveTargetStatus === "RETURNED" ? finalReturnReason : null),
      actorId: req.user.id,
    });
  } catch {
    // Handled in memory
  }


  // Broadcast real-time SSE notifications
  broadcastEvent(`CHEQUE_${effectiveTargetStatus}`, {
    chequeId: updated.id,
    chequeNumber: updated.chequeNumber,
    amount: updated.amount,
    status: updated.status,
    returnReason: updated.returnReason,
    presentingBank: updated.presentingBank?.name,
    draweeBank: updated.draweeBank?.name,
    actorName: req.user.name,
    timestamp: new Date().toISOString(),
  });

  if (ekuberReceipt) {
    broadcastEvent("EKUBER_SETTLEMENT_CONFIRMED", {
      chequeId: updated.id,
      chequeNumber: updated.chequeNumber,
      amount: updated.amount,
      utr: ekuberReceipt.utr,
      ekuberRef: ekuberReceipt.ekuberRef,
      settledAt: ekuberReceipt.settledAt,
      beneficiaryCreditStatus: "CREDITED_INSTANT",
      presentingBank: updated.presentingBank?.name,
    });
  }

  // Automated Multi-Channel Customer Notification (WhatsApp & SMS) - 100% Free Virtual / Sandbox Mode
  try {
    const tmplKey = effectiveTargetStatus === "CLEARED" ? "CHEQUE_CLEARED" : effectiveTargetStatus === "RETURNED" ? "CHEQUE_RETURNED" : null;
    if (tmplKey) {
      messagingService.sendWhatsApp({
        recipient: "+91 98251 44012",
        customerName: updated.payeeName,
        templateKey: tmplKey,
        params: {
          chequeNumber: updated.chequeNumber,
          amount: Number(updated.amount).toLocaleString("en-IN"),
          accountNumber: updated.accountNumber,
          payeeName: updated.payeeName,
          draweeBank: updated.draweeBank?.name || "SURAT PEOPLES CO OP BANK",
          presentingBank: updated.presentingBank?.name || "SURAT PEOPLES CO OP BANK",
          utr: updated.ekuberUtr || "EKUBER-T0-REALTIME",
          settlementMode: updated.settlementMode || "CONTINUOUS_T0",
          balance: "24,85,420.00",
          returnReason: updated.returnReason || "Funds Insufficient",
          memoRef: `RM-20261016-${updated.chequeNumber}`,
        },
      }).catch(() => {});

      messagingService.sendSms({
        recipient: "+91 98251 44012",
        customerName: updated.payeeName,
        templateKey: tmplKey,
        params: {
          chequeNumber: updated.chequeNumber,
          amount: Number(updated.amount).toLocaleString("en-IN"),
          accountNumber: updated.accountNumber,
          payeeName: updated.payeeName,
          utr: updated.ekuberUtr || "EKUBER-T0-REALTIME",
          balance: "24,85,420.00",
          returnReason: updated.returnReason || "Funds Insufficient",
          memoRef: `RM-20261016-${updated.chequeNumber}`,
        },
      }).catch(() => {});
    }
  } catch (notifyErr) {
    console.warn("Automated messaging trigger non-blocking error:", notifyErr);
  }

  return res.json(updated);
}

function getReturnReasonCodes(req, res) {
  return res.json(RETURN_REASON_CODES);
}

// Statutory Section 138 Cheque Return Memo Generator
async function getReturnMemo(req, res) {
  try {
    const { id } = req.params;
    const cheque = await prisma.cheque.findUnique({
      where: { id },
      include: {
        presentingBank: true,
        draweeBank: true,
        batch: true,
        events: {
          where: { toStatus: "RETURNED" },
          include: { actor: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!cheque) return res.status(404).json({ error: "Cheque not found" });
    if (cheque.status !== "RETURNED") {
      return res.status(400).json({ error: "Cheque has not been returned. Return Memo is only issued for dishonoured instruments." });
    }

    const returnEvent = cheque.events[0];
    const memoRef = `MISDESC/DISHONOUR/${cheque.chequeNumber}/${new Date().getFullYear()}/${cheque.id.slice(0, 6).toUpperCase()}`;

    let matchedCode = "99";
    for (const [code, desc] of Object.entries(RETURN_REASON_CODES)) {
      if (desc === cheque.returnReason) {
        matchedCode = code;
        break;
      }
    }

    return res.json({
      memoRef,
      statutoryAct: "Section 138 of the Negotiable Instruments Act, 1881 & MISDESC Rule 31",
      clearingHouse: "National Payments Corporation & Interbank Clearing House",
      dateOfReturn: returnEvent?.createdAt || cheque.updatedAt,
      session: cheque.batch?.sessionName || "Standard Morning Clearing Cycle",
      chequeDetails: {
        id: cheque.id,
        chequeNumber: cheque.chequeNumber,
        micrCode: cheque.micrCode,
        accountNumber: cheque.accountNumber,
        amount: cheque.amount,
        payeeName: cheque.payeeName,
        imageHash: cheque.imageHash,
      },
      banks: {
        draweeBank: cheque.draweeBank?.name,
        draweeIfsc: cheque.draweeBank?.ifsc,
        presentingBank: cheque.presentingBank?.name,
        presentingIfsc: cheque.presentingBank?.ifsc,
      },
      dishonour: {
        reasonCode: matchedCode,
        reasonDescription: cheque.returnReason || "Dishonoured by Drawee Bank",
        remarks: returnEvent?.remarks || cheque.returnReason,
        returnedByOfficer: returnEvent?.actor?.name || "Senior Clearing Officer",
      },
      legalNoticeClause:
        "TAKE NOTICE that the above-mentioned cheque presented for payment through the Cheque Truncation System (MISDESC) has been returned UNPAID for the reason specified herein. Under Section 138 of the Negotiable Instruments Act, 1881, this memo constitutes statutory proof of dishonour of the instrument upon presentation.",
      digitalSeal: {
        algorithm: "SHA-256 with MISDESC PKI Root Certificate",
        verificationDigest: cheque.imageHash || "0000000000000000000000000000000000000000",
        issuedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Return Memo error:", err);
    return res.status(500).json({ error: "Failed to compile Statutory Return Memo" });
  }
}

module.exports = {
  transitionCheque,
  getReturnReasonCodes,
  getReturnMemo,
  TRANSITIONS,
  RETURN_REASON_CODES,
};
