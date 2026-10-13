const swarmService = require("../services/swarm.service");

async function evaluateCheque(req, res, next) {
  try {
    const { chequeId } = req.params;
    const docket = await swarmService.evaluateChequeWithSwarm(chequeId);
    return res.json(docket);
  } catch (err) {
    next(err);
  }
}

async function getChequeDocket(req, res, next) {
  try {
    const { chequeId } = req.params;
    const docket = await swarmService.getDocket(chequeId);
    return res.json(docket);
  } catch (err) {
    next(err);
  }
}

async function autoAdjudicateSession(req, res, next) {
  try {
    const summary = await swarmService.autoAdjudicateActiveSession();
    return res.json(summary);
  } catch (err) {
    next(err);
  }
}

async function simulateAdversarialFraud(req, res, next) {
  try {
    const report = swarmService.simulateAdversarialAttack(req.body);
    return res.json(report);
  } catch (err) {
    next(err);
  }
}

async function getRadarSample(req, res, next) {
  try {
    const report = swarmService.simulateAdversarialAttack({ scenario: "CLEAN_BASELINE" });
    return res.json(report);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  evaluateCheque,
  getChequeDocket,
  autoAdjudicateSession,
  simulateAdversarialFraud,
  getRadarSample,
};
