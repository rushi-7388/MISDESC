const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  evaluateCheque,
  getChequeDocket,
  autoAdjudicateSession,
  simulateAdversarialFraud,
  getRadarSample,
} = require("../controllers/swarm.controller");

const router = express.Router();

router.use(authenticate);

// Phase 8: Autonomous 4-Agent Deliberation Sandbox & Adversarial Fraud Playground
router.post("/adversarial/simulate", authorize("DRAWEE_BANK", "ADMIN", "COMPLIANCE_AUDITOR", "BRANCH_MANAGER"), simulateAdversarialFraud);
router.get("/radar/sample", authorize("DRAWEE_BANK", "ADMIN", "COMPLIANCE_AUDITOR", "BRANCH_MANAGER"), getRadarSample);

// Evaluate specific instrument with 4-Agent Autonomous Swarm
router.post("/evaluate/:chequeId", authorize("DRAWEE_BANK", "ADMIN", "BRANCH_MANAGER"), evaluateCheque);

// Retrieve existing or generated Multi-Modal Forensic Docket
router.get("/docket/:chequeId", authorize("DRAWEE_BANK", "ADMIN", "BRANCH_MANAGER", "COMPLIANCE_AUDITOR"), getChequeDocket);

// Batch Autonomous Straight-Through Processing (STP) Adjudication
router.post("/auto-adjudicate", authorize("DRAWEE_BANK", "ADMIN"), autoAdjudicateSession);

module.exports = router;
