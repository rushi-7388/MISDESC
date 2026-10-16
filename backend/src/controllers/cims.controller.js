const cimsService = require("../services/cims.service");

async function generateCimsReturn(req, res) {
  try {
    const { returnType, reportingDate, reportingBank, totalVolume, totalAmountInr, dishonouredCount, dishonouredAmountInr } = req.body;
    const result = cimsService.generateCimsXml({
      returnType,
      reportingDate,
      reportingBank,
      totalVolume,
      totalAmountInr,
      dishonouredCount,
      dishonouredAmountInr,
    });
    return res.status(201).json({ success: true, message: "RBI CIMS XML return generated successfully", ...result });
  } catch (err) {
    console.error("CIMS return generation failed:", err);
    return res.status(500).json({ error: "Failed to generate CIMS return" });
  }
}

async function generateSection138Memo(req, res) {
  try {
    const memo = cimsService.generateSection138Memo(req.body);
    return res.json({ success: true, memo });
  } catch (err) {
    console.error("Section 138 memo generation failed:", err);
    return res.status(500).json({ error: "Failed to generate Section 138 memo" });
  }
}

async function getReturnAnalytics(req, res) {
  try {
    const analytics = cimsService.getReturnAnalytics();
    return res.json({ success: true, returnReasonCodes: cimsService.RETURN_REASON_CODES, analytics });
  } catch (err) {
    console.error("Failed to load return analytics:", err);
    return res.status(500).json({ error: "Failed to load return reason analytics" });
  }
}

async function listComplianceEscalations(req, res) {
  try {
    const escalations = cimsService.listComplianceEscalations();
    return res.json({ success: true, escalations });
  } catch (err) {
    console.error("Failed to list compliance escalations:", err);
    return res.status(500).json({ error: "Failed to list escalations" });
  }
}

async function actionComplianceEscalation(req, res) {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    const actorName = req.user?.name || "Compliance Officer";
    const ticket = cimsService.actionComplianceEscalation(id, action, actorName, notes);
    return res.json({ success: true, message: `Escalation updated to ${ticket.status}`, ticket });
  } catch (err) {
    console.error("Failed to action compliance escalation:", err);
    return res.status(400).json({ error: err.message || "Failed to update escalation ticket" });
  }
}

module.exports = {
  generateCimsReturn,
  generateSection138Memo,
  getReturnAnalytics,
  listComplianceEscalations,
  actionComplianceEscalation,
};
