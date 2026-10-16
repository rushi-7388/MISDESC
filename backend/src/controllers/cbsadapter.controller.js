const cbsAdapterService = require("../services/cbsadapter.service");

async function exportCamt053(req, res) {
  try {
    const { statementId, accountIban, openingBalance, closingBalance, transactions } = req.body || {};
    const result = cbsAdapterService.generateCamt053Xml({
      statementId,
      accountIban,
      openingBalance: openingBalance ? Number(openingBalance) : 150000000.0,
      closingBalance: closingBalance ? Number(closingBalance) : 168250000.0,
      transactions,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("camt.053 generation failed:", err);
    return res.status(500).json({ error: "Failed to generate camt.053 statement" });
  }
}

async function exportCamt054(req, res) {
  try {
    const { chequeId } = req.params;
    const { accountNumber, amount, creditDebitIndicator, payerName, payeeName } = req.body || {};
    const result = cbsAdapterService.generateCamt054Xml({
      chequeNumber: chequeId || "000456",
      accountNumber,
      amount,
      creditDebitIndicator,
      payerName,
      payeeName,
    });
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("camt.054 generation failed:", err);
    return res.status(500).json({ error: "Failed to generate camt.054 notification" });
  }
}

async function simulateCbsInquiry(req, res) {
  try {
    const { system, accountNumber, amount } = req.body;
    const result = cbsAdapterService.simulateCbsInquiry({ system, accountNumber, amount });
    return res.json({ success: true, result });
  } catch (err) {
    console.error("CBS simulation failed:", err);
    return res.status(500).json({ error: "Failed to simulate CBS inquiry" });
  }
}

async function getAdapterStatus(req, res) {
  try {
    const adapters = cbsAdapterService.getAdapterStatus();
    return res.json({ success: true, adapters });
  } catch (err) {
    console.error("Failed to load adapter status:", err);
    return res.status(500).json({ error: "Failed to load adapter status" });
  }
}

module.exports = {
  exportCamt053,
  exportCamt054,
  simulateCbsInquiry,
  getAdapterStatus,
};
