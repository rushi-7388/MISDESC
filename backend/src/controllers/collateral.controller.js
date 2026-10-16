const collateralService = require("../services/collateral.service");

async function getPortfolios(req, res) {
  try {
    const portfolios = collateralService.getPortfolios();
    return res.json({ success: true, haircuts: collateralService.HAIRCUTS, portfolios });
  } catch (err) {
    console.error("Failed to fetch portfolios:", err);
    return res.status(500).json({ error: "Failed to fetch collateral portfolios" });
  }
}

async function pledgeSecurity(req, res) {
  try {
    const { bankCode, type, isin, nominalValue } = req.body;
    if (!nominalValue || isNaN(nominalValue) || Number(nominalValue) <= 0) {
      return res.status(400).json({ error: "Valid nominalValue is required" });
    }
    const holding = collateralService.pledgeSecurity({ bankCode, type, isin, nominalValue });
    return res.status(201).json({ success: true, message: "Collateral pledged successfully", holding });
  } catch (err) {
    console.error("Collateral pledge failed:", err);
    return res.status(500).json({ error: err.message || "Failed to pledge collateral" });
  }
}

async function unpledgeSecurity(req, res) {
  try {
    const { bankCode, holdingId } = req.body;
    if (!bankCode || !holdingId) {
      return res.status(400).json({ error: "bankCode and holdingId are required" });
    }
    const holding = collateralService.unpledgeSecurity(bankCode, holdingId);
    return res.json({ success: true, message: "Collateral unpledged successfully", holding });
  } catch (err) {
    console.error("Collateral unpledge failed:", err);
    return res.status(400).json({ error: err.message || "Failed to unpledge collateral" });
  }
}

async function drawdownRepoLine(req, res) {
  try {
    const { bankCode, amount } = req.body;
    if (!bankCode || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid bankCode and amount are required" });
    }
    const transaction = collateralService.drawdownRepoLine(bankCode, amount);
    return res.json({ success: true, message: "Intraday Repo drawn successfully", transaction });
  } catch (err) {
    console.error("Repo drawdown failed:", err);
    return res.status(400).json({ error: err.message || "Failed to execute Repo line drawdown" });
  }
}

async function runStressTest(req, res) {
  try {
    const { scenarioType } = req.body;
    const report = collateralService.runStressTest(scenarioType);
    return res.json({ success: true, report });
  } catch (err) {
    console.error("Stress test failed:", err);
    return res.status(500).json({ error: "Failed to execute liquidity stress simulation" });
  }
}

module.exports = {
  getPortfolios,
  pledgeSecurity,
  unpledgeSecurity,
  drawdownRepoLine,
  runStressTest,
};
