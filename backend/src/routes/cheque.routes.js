const express = require("express");
const {
  scanOcrCheque,
  createCheque,
  listCheques,
  getCheque,
  getChequeIso20022,
  registerPositivePay,
  listPositivePay,
  getSignatureComparison,
  getChequeForensics,
  bulkIngestCheques,
} = require("../controllers/cheque.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const { transitionCheque } = require("../controllers/clearing.controller");

const router = express.Router();

router.use(authenticate);

router.post("/scan-ocr", upload.single("chequeImage"), scanOcrCheque);
router.post("/positive-pay", registerPositivePay);
router.get("/positive-pay", listPositivePay);
router.post("/bulk-ingest", authorize("PRESENTING_BANK", "BRANCH_MANAGER", "ADMIN"), bulkIngestCheques);
router.post("/", authorize("PRESENTING_BANK", "BRANCH_MANAGER", "ADMIN"), upload.single("chequeImage"), createCheque);
router.get("/", listCheques);
router.get("/:id", getCheque);
router.patch("/:id/status", authorize("DRAWEE_BANK", "BRANCH_MANAGER", "SETTLEMENT_OFFICER", "PRESENTING_BANK", "ADMIN"), transitionCheque);
router.get("/:id/signature-comparison", getSignatureComparison);
router.get("/:id/forensics", getChequeForensics);
router.get("/:id/iso20022", getChequeIso20022);

module.exports = router;
