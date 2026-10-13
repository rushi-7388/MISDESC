const prisma = require("../config/prisma");
const { recordChainedEvent } = require("../utils/ledger.util");
const { branchManagerOverridesTotal } = require("../utils/metrics.util");

/**
 * Get Branch Summary KPIs
 */
async function getBranchSummary(req, res, next) {
  try {
    const bankId = req.user.bankId;
    const branchName = req.user.branchName || "Athwa Lines Branch";

    const [totalPresented, totalCleared, totalReturned, awaitingApproval, totalBatchCount] =
      await Promise.all([
        prisma.cheque.count({
          where: { presentingBankId: bankId },
        }),
        prisma.cheque.count({
          where: { presentingBankId: bankId, status: "CLEARED" },
        }),
        prisma.cheque.count({
          where: { presentingBankId: bankId, status: "RETURNED" },
        }),
        prisma.cheque.count({
          where: {
            presentingBankId: bankId,
            branchManagerApproved: false,
            amount: { gte: 50000 },
          },
        }),
        prisma.batch.count(),
      ]);

    const amountAgg = await prisma.cheque.aggregate({
      where: { presentingBankId: bankId },
      _sum: { amount: true },
    });

    return res.json({
      branchName,
      bankId,
      totalPresented,
      totalCleared,
      totalReturned,
      awaitingApproval,
      totalBatchCount,
      totalPresentedAmount: amountAgg._sum.amount || 0,
      tellerOperatingLimit: 100000,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List cheques originating from or presented at this branch
 */
async function getBranchCheques(req, res, next) {
  try {
    const bankId = req.user.bankId;
    const { status, highValueOnly } = req.query;

    const where = { presentingBankId: bankId };
    if (status) where.status = status;
    if (highValueOnly === "true") where.amount = { gte: 50000 };

    const cheques = await prisma.cheque.findMany({
      where,
      include: {
        presentingBank: true,
        draweeBank: true,
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return res.json(cheques);
  } catch (err) {
    next(err);
  }
}

/**
 * Branch Manager Counter-Signature / High-Value Approval
 */
async function approveBranchCheque(req, res, next) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const cheque = await prisma.cheque.findUnique({
      where: { id },
    });

    if (!cheque) {
      return res.status(404).json({ error: "Cheque not found" });
    }

    const updated = await prisma.cheque.update({
      where: { id },
      data: { branchManagerApproved: true },
    });

    // Record in SHA-256 immutable ledger
    await recordChainedEvent({
      chequeId: cheque.id,
      fromStatus: cheque.status,
      toStatus: cheque.status,
      remarks: `Branch Manager counter-signature authorized by ${req.user.email}. ${notes ? `Notes: ${notes}` : ""}`,
      actorId: req.user.id,
    });

    branchManagerOverridesTotal.inc({ branch: req.user.branchName || "Athwa Lines Branch", action: "APPROVE" });

    return res.json({
      success: true,
      message: "Instrument counter-signed and approved for MISDESC switch clearing.",
      cheque: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Branch Batch Dispatch to Central Switch
 */
async function dispatchBranchBatch(req, res, next) {
  try {
    const { batchId } = req.body;
    const batch = await prisma.batch.findFirst({
      where: batchId ? { id: batchId } : { status: "OPEN" },
      include: { cheques: true },
    });

    if (!batch) {
      return res.status(404).json({ error: "No active branch batch found to dispatch." });
    }

    const updated = await prisma.batch.update({
      where: { id: batch.id },
      data: { status: "LOCKED", closedAt: new Date() },
    });

    return res.json({
      success: true,
      message: `Branch batch ${batch.sessionCode} sealed and dispatched to MISDESC Core Switch.`,
      batch: updated,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBranchSummary,
  getBranchCheques,
  approveBranchCheque,
  dispatchBranchBatch,
};
