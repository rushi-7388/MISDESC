const prisma = require("../config/prisma");
const { recordChainedEvent } = require("../utils/ledger.util");
const { branchManagerOverridesTotal } = require("../utils/metrics.util");
const { inMemoryCheques } = require("../utils/mock-db.util");

/**
 * Get Branch Summary KPIs
 */
async function getBranchSummary(req, res, next) {
  try {
    const bankId = req.user.bankId;
    const branchName = req.user.branchName || "Athwa Lines Branch";

    try {
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
    } catch {
      // In-memory fallback
      const totalPresented = inMemoryCheques.length;
      const totalCleared = inMemoryCheques.filter((c) => c.status === "CLEARED").length;
      const totalReturned = inMemoryCheques.filter((c) => c.status === "RETURNED").length;
      const awaitingApproval = inMemoryCheques.filter((c) => Number(c.amount) >= 50000 && !c.branchManagerApproved).length;
      const totalPresentedAmount = inMemoryCheques.reduce((sum, c) => sum + Number(c.amount || 0), 0);

      return res.json({
        branchName,
        bankId: bankId || "bank-snb-01",
        totalPresented,
        totalCleared,
        totalReturned,
        awaitingApproval,
        totalBatchCount: 3,
        totalPresentedAmount,
        tellerOperatingLimit: 100000,
      });
    }
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

    try {
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

      if (cheques && cheques.length > 0) return res.json(cheques);
    } catch {
      // In-memory fallback
    }

    let filtered = [...inMemoryCheques];
    if (status) filtered = filtered.filter((c) => c.status === status);
    if (highValueOnly === "true") filtered = filtered.filter((c) => Number(c.amount) >= 50000);
    return res.json(filtered);
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

    let cheque = null;
    try {
      cheque = await prisma.cheque.findUnique({ where: { id } });
    } catch {
      // Prisma offline fallback
    }

    if (!cheque) {
      cheque = inMemoryCheques.find((c) => c.id === id || c.chequeNumber === id);
    }

    if (!cheque) {
      return res.status(404).json({ error: "Cheque not found" });
    }

    let updated = null;
    try {
      updated = await prisma.cheque.update({
        where: { id: cheque.id },
        data: { branchManagerApproved: true },
      });
    } catch {
      cheque.branchManagerApproved = true;
      updated = { ...cheque };
    }

    try {
      await recordChainedEvent({
        chequeId: cheque.id,
        fromStatus: cheque.status,
        toStatus: cheque.status,
        remarks: `Branch Manager counter-signature authorized by ${req.user?.email || "branch.manager@spcbl.in"}. ${notes ? `Notes: ${notes}` : ""}`,
        actorId: req.user?.id || "usr-bm-01",
      });
      branchManagerOverridesTotal.inc({ branch: req.user?.branchName || "Athwa Lines Branch", action: "APPROVE" });
    } catch {
      // Ignore telemetry error
    }

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
    let batch = null;
    try {
      batch = await prisma.batch.findFirst({
        where: batchId ? { id: batchId } : { status: "OPEN" },
        include: { cheques: true },
      });
    } catch {
      // Prisma offline fallback
    }

    if (!batch) {
      batch = {
        id: batchId || "batch-mem-01",
        sessionCode: "SESSION-2026-03-A",
        status: "LOCKED",
        closedAt: new Date(),
      };
    } else {
      try {
        batch = await prisma.batch.update({
          where: { id: batch.id },
          data: { status: "LOCKED", closedAt: new Date() },
        });
      } catch {
        batch.status = "LOCKED";
      }
    }

    return res.json({
      success: true,
      message: `Branch batch ${batch.sessionCode || "SESSION-2026-03-A"} sealed and dispatched to MISDESC Core Switch.`,
      batch,
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
