const prisma = require("../config/prisma");
const { broadcastEvent } = require("../utils/sse.util");

/**
 * Dispute Resolution Mechanism (DRM) & Chargeback Claims Service
 * Conforms to NPCI MISDESC Procedural Guidelines Rule 32 & RBI Ombudsman Framework.
 */

const DEFAULT_SLA_HOURS = 72; // Statutory 72-hour regulatory resolution window

/**
 * Generates an official MISDESC Dispute Resolution Reference Number.
 * Format: DRM/YYYY/<seq>
 */
function generateClaimNumber() {
  const year = new Date().getFullYear();
  const seq = Math.floor(10000 + Math.random() * 90000);
  return `DRM/${year}/${seq}`;
}

/**
 * Files a new clearing dispute / chargeback claim against an instrument.
 */
async function fileDispute({
  chequeId,
  initiatingBankId,
  disputeType,
  claimAmount,
  filedById,
  evidenceNotes,
}) {
  const cheque = await prisma.cheque.findUnique({
    where: { id: chequeId },
    include: { presentingBank: true, draweeBank: true },
  });

  if (!cheque) {
    const error = new Error("Target cheque not found");
    error.status = 404;
    throw error;
  }

  // Determine respondent bank
  const respondentBankId =
    initiatingBankId === cheque.presentingBankId
      ? cheque.draweeBankId
      : cheque.presentingBankId;

  const claimNumber = generateClaimNumber();
  const slaDeadline = new Date(Date.now() + DEFAULT_SLA_HOURS * 60 * 60 * 1000);

  const dispute = await prisma.$transaction(async (tx) => {
    const created = await tx.disputeClaim.create({
      data: {
        claimNumber,
        chequeId,
        initiatingBankId,
        respondentBankId,
        disputeType,
        claimAmount: Number(claimAmount || cheque.amount),
        status: "FILED",
        filedById,
        evidenceNotes,
        slaDeadline,
      },
      include: {
        cheque: true,
        initiatingBank: true,
        respondentBank: true,
        filedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await tx.disputeAuditLog.create({
      data: {
        disputeId: created.id,
        actorId: filedById,
        fromStatus: null,
        toStatus: "FILED",
        actionNotes: `Claim ${claimNumber} registered. Reason: ${disputeType}. SLA: 72h.`,
      },
    });

    return created;
  });

  broadcastEvent("DISPUTE_FILED", {
    disputeId: dispute.id,
    claimNumber: dispute.claimNumber,
    chequeNumber: cheque.chequeNumber,
    disputeType: dispute.disputeType,
    initiatingBank: dispute.initiatingBank.name,
    respondentBank: dispute.respondentBank.name,
    claimAmount: dispute.claimAmount,
    slaDeadline: dispute.slaDeadline,
    timestamp: new Date().toISOString(),
  });

  return dispute;
}

/**
 * Lists dispute claims filtered by user role or bank affiliation.
 */
async function listDisputes({ bankId, role, status }) {
  const where = {
    ...(status ? { status } : {}),
    ...(role === "ADMIN" || role === "COMPLIANCE_AUDITOR"
      ? {}
      : {
          OR: [{ initiatingBankId: bankId }, { respondentBankId: bankId }],
        }),
  };

  const disputes = await prisma.disputeClaim.findMany({
    where,
    include: {
      cheque: {
        select: {
          id: true,
          chequeNumber: true,
          amount: true,
          payeeName: true,
          status: true,
          accountNumber: true,
          ifsc: true,
        },
      },
      initiatingBank: { select: { id: true, name: true, code: true } },
      respondentBank: { select: { id: true, name: true, code: true } },
      filedBy: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true, email: true } },
      logs: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return disputes;
}

/**
 * Retrieves a single dispute claim by ID with full audit history.
 */
async function getDisputeById(disputeId) {
  const dispute = await prisma.disputeClaim.findUnique({
    where: { id: disputeId },
    include: {
      cheque: true,
      initiatingBank: true,
      respondentBank: true,
      filedBy: { select: { id: true, name: true, email: true, role: true } },
      resolvedBy: { select: { id: true, name: true, email: true, role: true } },
      logs: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!dispute) {
    const error = new Error("Dispute claim not found");
    error.status = 404;
    throw error;
  }

  return dispute;
}

/**
 * Appends evidence notes or updates status during dispute review.
 */
async function updateDisputeStatus({
  disputeId,
  actorId,
  toStatus,
  actionNotes,
  resolutionSummary,
}) {
  const dispute = await prisma.disputeClaim.findUnique({
    where: { id: disputeId },
    include: { initiatingBank: true, respondentBank: true },
  });

  if (!dispute) {
    const error = new Error("Dispute claim not found");
    error.status = 404;
    throw error;
  }

  const isResolved = ["RESOLVED_CLAIMANT", "RESOLVED_RESPONDENT", "CLOSED"].includes(toStatus);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedRecord = await tx.disputeClaim.update({
      where: { id: disputeId },
      data: {
        status: toStatus,
        ...(isResolved ? { resolvedById: actorId, resolutionSummary } : {}),
      },
      include: {
        cheque: true,
        initiatingBank: true,
        respondentBank: true,
        filedBy: { select: { id: true, name: true, email: true } },
        resolvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.disputeAuditLog.create({
      data: {
        disputeId,
        actorId,
        fromStatus: dispute.status,
        toStatus,
        actionNotes: actionNotes || resolutionSummary || `Status transition to ${toStatus}`,
      },
    });

    return updatedRecord;
  });

  broadcastEvent("DISPUTE_STATUS_CHANGED", {
    disputeId: updated.id,
    claimNumber: updated.claimNumber,
    fromStatus: dispute.status,
    toStatus,
    resolutionSummary: updated.resolutionSummary,
    timestamp: new Date().toISOString(),
  });

  return updated;
}

module.exports = {
  generateClaimNumber,
  fileDispute,
  listDisputes,
  getDisputeById,
  updateDisputeStatus,
};
