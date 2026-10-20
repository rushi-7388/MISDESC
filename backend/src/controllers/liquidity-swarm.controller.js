const liquiditySwarm = require("../services/liquidity-swarm.service");

function getState(req, res) {
  try {
    return res.json(liquiditySwarm.getSwarmState());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function resolve(req, res) {
  try {
    const result = liquiditySwarm.resolveGridlock();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function autoRepo(req, res) {
  try {
    const { bankCode, amount } = req.body;
    if (!bankCode || !amount) {
      return res.status(400).json({ error: "bankCode and amount are required" });
    }
    const result = liquiditySwarm.executeGSecAutoRepo(bankCode, amount);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getState,
  resolve,
  autoRepo,
};
