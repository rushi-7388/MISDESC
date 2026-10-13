const liquidityService = require("../services/liquidity.service");
const lsmService = require("../services/lsm.service");
const { validatePositiveNumber } = require("../validators/schemas");

async function getBankLiquidity(req, res, next) {
  try {
    const targetBankId = req.params.bankId || req.user.bankId;
    const pool = await liquidityService.getOrCreateLiquidityPool(targetBankId);
    const metrics = liquidityService.calculatePoolMetrics(pool);
    return res.json({ ...pool, metrics });
  } catch (err) {
    next(err);
  }
}

async function getSystemSummary(req, res, next) {
  try {
    const summary = await liquidityService.getSystemLiquiditySummary();
    return res.json(summary);
  } catch (err) {
    next(err);
  }
}

async function updateCollateral(req, res, next) {
  try {
    const targetBankId = req.params.bankId || req.user.bankId;
    const { allocatedCollateral, creditLine, remarks } = req.body;

    if (allocatedCollateral !== undefined) {
      validatePositiveNumber(allocatedCollateral, "allocatedCollateral");
    }
    if (creditLine !== undefined) {
      validatePositiveNumber(creditLine, "creditLine");
    }

    const updated = await liquidityService.updateCollateralAllocation(targetBankId, {
      allocatedCollateral,
      creditLine,
      remarks,
    });

    return res.json({
      message: "Collateral allocation updated successfully",
      pool: updated,
    });
  } catch (err) {
    next(err);
  }
}

async function getLsmTopology(req, res, next) {
  try {
    const topology = await lsmService.getGridlockTopology();
    return res.json(topology);
  } catch (err) {
    next(err);
  }
}

async function resolveLsmGridlock(req, res, next) {
  try {
    const result = await lsmService.resolveGridlock();
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function resetLsmTopology(req, res, next) {
  try {
    const topology = await lsmService.resetTopology();
    return res.json(topology);
  } catch (err) {
    next(err);
  }
}

async function toggleLsmDaemon(req, res, next) {
  try {
    const { enabled, intervalMs, autoSolve } = req.body;
    const status = lsmService.toggleAutoDaemon(enabled, intervalMs, autoSolve);
    return res.json({
      message: `LSM Real-Time Gridlock Daemon ${status.enabled ? "ACTIVATED" : "DEACTIVATED"}`,
      status,
    });
  } catch (err) {
    next(err);
  }
}

async function getLsmDaemonStatus(req, res, next) {
  try {
    const status = lsmService.getDaemonStatus();
    return res.json(status);
  } catch (err) {
    next(err);
  }
}

async function simulateLsmShock(req, res, next) {
  try {
    const result = await lsmService.injectLiquidityShock(req.body);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBankLiquidity,
  getSystemSummary,
  updateCollateral,
  getLsmTopology,
  resolveLsmGridlock,
  resetLsmTopology,
  toggleLsmDaemon,
  getLsmDaemonStatus,
  simulateLsmShock,
};



