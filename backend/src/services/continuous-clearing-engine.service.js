/**
 * ==============================================================================
 * RBI Continuous Clearing Mandate: Hourly Rolling T+0 Realization Engine
 * ==============================================================================
 * Formalized under RBI Governor Shaktikanta Das's Directive (Aug 2024 / Oct 2025).
 * Replaces legacy T+1 batch clearing with continuous hourly net settlement batches
 * between 10:00 AM and 7:00 PM with a strict 60-minute customer crediting SLA.
 */

const crypto = require("crypto");

// Daily operational windows defined by RBI
const OPERATIONAL_SCHEDULE = {
  presentationWindow: { startHour: 10, endHour: 16, desc: "10:00 AM - 04:00 PM (Continuous Presentation)" },
  confirmationWindow: { startHour: 10, endHour: 19, desc: "10:00 AM - 07:00 PM (Drawee Confirmation)" },
  settlementBatches: [
    { batchId: "BATCH-H11", time: "11:00 AM", cutoffHour: 11 },
    { batchId: "BATCH-H12", time: "12:00 PM", cutoffHour: 12 },
    { batchId: "BATCH-H13", time: "01:00 PM", cutoffHour: 13 },
    { batchId: "BATCH-H14", time: "02:00 PM", cutoffHour: 14 },
    { batchId: "BATCH-H15", time: "03:00 PM", cutoffHour: 15 },
    { batchId: "BATCH-H16", time: "04:00 PM", cutoffHour: 16 },
    { batchId: "BATCH-H17", time: "05:00 PM", cutoffHour: 17 },
    { batchId: "BATCH-H18", time: "06:00 PM", cutoffHour: 18 },
    { batchId: "BATCH-H19", time: "07:00 PM", cutoffHour: 19 },
  ],
  customerCreditSlaMinutes: 60,
};

/**
 * Get current RBI Clearing operational state & next hourly batch countdown
 */
function getContinuousClearingOperationalStatus() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSeconds = now.getSeconds();

  const isPresentationOpen = currentHour >= 10 && currentHour < 16;
  const isConfirmationOpen = currentHour >= 10 && currentHour < 19;

  // Find next hourly settlement batch
  const nextBatch = OPERATIONAL_SCHEDULE.settlementBatches.find(
    (b) => b.cutoffHour > currentHour || (b.cutoffHour === currentHour && currentMinute === 0)
  ) || OPERATIONAL_SCHEDULE.settlementBatches[0];

  // Seconds remaining to next hourly batch
  const nextBatchDate = new Date(now);
  nextBatchDate.setHours(nextBatch.cutoffHour, 0, 0, 0);
  if (nextBatchDate <= now) {
    nextBatchDate.setDate(nextBatchDate.getDate() + 1);
  }
  const secondsToNextBatch = Math.max(0, Math.floor((nextBatchDate - now) / 1000));

  return {
    timestamp: now.toISOString(),
    isLive: true,
    directive: "RBI Continuous Clearing Directive 2024-25 (T+0 On-Realisation)",
    schedule: OPERATIONAL_SCHEDULE,
    currentWindow: {
      presentationStatus: isPresentationOpen ? "OPEN_ACCEPTING_INSTRUMENTS" : "CLOSED_PRESENTATION_WINDOW",
      confirmationStatus: isConfirmationOpen ? "ACTIVE_CONFIRMATIONS" : "OVERNIGHT_MAINTENANCE",
      activeHour: currentHour,
      activeMinute: currentMinute,
    },
    nextHourlyBatch: {
      batchId: nextBatch.batchId,
      scheduledTime: nextBatch.time,
      secondsRemaining: secondsToNextBatch,
      countdownFormatted: `${Math.floor(secondsToNextBatch / 60)}m ${secondsToNextBatch % 60}s`,
    },
    customerCreditSla: {
      statutoryMaxMinutes: 60,
      rule: "Presenting banks MUST credit customer accounts within 60 minutes of central bank settlement.",
      penaltyClause: "₹100/day compensatory credit interest under RBI Ombudsman circular.",
    },
  };
}

/**
 * Execute an Hourly Rolling Net Settlement Batch
 */
function executeHourlySettlementBatch({ batchId, eligibleCheques = [] }) {
  const executionTime = new Date();
  const utr = `RBIR5${executionTime.getFullYear()}${(executionTime.getMonth() + 1).toString().padStart(2, "0")}${executionTime.getDate().toString().padStart(2, "0")}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const batchRef = batchId || `BATCH-H${executionTime.getHours().toString().padStart(2, "0")}`;

  const totalVolume = eligibleCheques.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const slaDeadline = new Date(executionTime.getTime() + 60 * 60 * 1000); // +60 mins

  return {
    success: true,
    batchRef,
    utr,
    settledAt: executionTime.toISOString(),
    customerCreditSlaDeadline: slaDeadline.toISOString(),
    instrumentsSettled: eligibleCheques.length,
    totalVolumeInr: totalVolume,
    pacs008XmlRef: `ISO20022/PACS008/${batchRef}/${utr}`,
    slaCountdownSeconds: 3600,
    status: "SETTLED_RTGS_REALIZED",
    statutoryCertificate: `CERT-RBI-CTS-T0-${batchRef}-${executionTime.getTime()}`,
  };
}

module.exports = {
  OPERATIONAL_SCHEDULE,
  getContinuousClearingOperationalStatus,
  executeHourlySettlementBatch,
};
