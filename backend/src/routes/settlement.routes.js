const express = require("express");
const {
  runSettlement,
  listSettlements,
  getSettlementIso20022,
  validateSettlementIso20022,
  getLiquidityMonitor,
  updateCollateralLimit,
  getContinuousSettlementStatus,
  toggleContinuousMode,
  settleChequeEkuber,
  getEkuberPacs009Xml,
} = require("../controllers/settlement.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/run", authorize("SETTLEMENT_OFFICER", "ADMIN"), runSettlement);
router.get("/liquidity-monitor", getLiquidityMonitor);
router.patch("/collateral-limit", authorize("SETTLEMENT_OFFICER", "ADMIN"), updateCollateralLimit);

// Continuous Clearing & RBI e-Kuber Routes
router.get("/continuous/status", getContinuousSettlementStatus);
router.post("/continuous/toggle", authorize("SETTLEMENT_OFFICER", "ADMIN"), toggleContinuousMode);
router.post("/continuous/settle-now/:chequeId", authorize("SETTLEMENT_OFFICER", "ADMIN"), settleChequeEkuber);
router.get("/ekuber/:id/pacs009", getEkuberPacs009Xml);

// Schema & Conformance Validation Route
router.post("/iso20022/validate", validateSettlementIso20022);

router.get("/", listSettlements);
router.get("/:id/iso20022", getSettlementIso20022);

module.exports = router;
