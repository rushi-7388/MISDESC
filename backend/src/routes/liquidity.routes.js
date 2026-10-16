const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  getBankLiquidity,
  getSystemSummary,
  updateCollateral,
  getLsmTopology,
  resolveLsmGridlock,
  resetLsmTopology,
  toggleLsmDaemon,
  getLsmDaemonStatus,
  simulateLsmShock,
} = require("../controllers/liquidity.controller");

const router = express.Router();

router.use(authenticate);

// Bank-level liquidity status (accessible to participating banks, managers, settlement officers, and admin)
router.get("/status", getBankLiquidity);
router.get("/status/:bankId", authorize("ADMIN", "SETTLEMENT_OFFICER", "COMPLIANCE_AUDITOR"), getBankLiquidity);

// System-wide liquidity dashboard (treasury settlement officers, auditors, admin)
router.get("/summary", authorize("ADMIN", "SETTLEMENT_OFFICER", "COMPLIANCE_AUDITOR"), getSystemSummary);

// Collateral allocation adjustments (central bank settlement officers and system admin)
router.post("/collateral", authorize("ADMIN", "SETTLEMENT_OFFICER"), updateCollateral);
router.post("/collateral/:bankId", authorize("ADMIN", "SETTLEMENT_OFFICER"), updateCollateral);

// Dynamic Collateral Management (LMS)
const collateralController = require("../controllers/collateral.controller");
router.get("/collateral/portfolios", collateralController.getPortfolios);
router.post("/collateral/pledge", authorize("ADMIN", "SETTLEMENT_OFFICER"), collateralController.pledgeSecurity);
router.post("/collateral/unpledge", authorize("ADMIN", "SETTLEMENT_OFFICER"), collateralController.unpledgeSecurity);
router.post("/collateral/repo-drawdown", authorize("ADMIN", "SETTLEMENT_OFFICER"), collateralController.drawdownRepoLine);
router.post("/collateral/stress-test", authorize("ADMIN", "SETTLEMENT_OFFICER", "IT_STAFF"), collateralController.runStressTest);

// LSM (Liquidity Saving Mechanism) Tarjan Cycle Gridlock Resolution Engine
router.get("/lsm/gridlock-topology", authorize("ADMIN", "SETTLEMENT_OFFICER", "COMPLIANCE_AUDITOR", "IT_STAFF"), getLsmTopology);
router.post("/lsm/resolve-gridlock", authorize("ADMIN", "SETTLEMENT_OFFICER", "IT_STAFF"), resolveLsmGridlock);
router.post("/lsm/reset", authorize("ADMIN", "SETTLEMENT_OFFICER", "IT_STAFF"), resetLsmTopology);
router.post("/lsm/daemon/toggle", authorize("ADMIN", "SETTLEMENT_OFFICER", "IT_STAFF"), toggleLsmDaemon);
router.get("/lsm/daemon/status", authorize("ADMIN", "SETTLEMENT_OFFICER", "COMPLIANCE_AUDITOR", "IT_STAFF"), getLsmDaemonStatus);
router.post("/lsm/simulate-shock", authorize("ADMIN", "SETTLEMENT_OFFICER", "IT_STAFF"), simulateLsmShock);

module.exports = router;



