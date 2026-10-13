const stressService = require("../services/stress.service");

async function generateBatch(req, res, next) {
  try {
    const { count, persistToDatabase } = req.body;
    const result = await stressService.generateSyntheticBatch({ count, persistToDatabase });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function runBenchmark(req, res, next) {
  try {
    const { targetTps, durationSec } = req.body;
    const result = await stressService.runClearingStressBenchmark({ targetTps, durationSec });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

function getTelemetry(req, res) {
  const telemetry = stressService.getClusterTelemetry();
  return res.json(telemetry);
}

module.exports = {
  generateBatch,
  runBenchmark,
  getTelemetry,
};
