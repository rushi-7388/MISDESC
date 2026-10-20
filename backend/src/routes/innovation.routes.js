const express = require("express");
const router = express.Router();
const innovationCtrl = require("../controllers/innovation.controller");
const { authenticate } = require("../middleware/auth.middleware");

// 1. Voice Banking NLP Engine
router.post("/voice/process", innovationCtrl.processVoice);

// 2. Geospatial CIT Radar
router.get("/transit/telemetry", innovationCtrl.getTransitTelemetry);
router.post("/transit/lockdown/:vanId", authenticate, innovationCtrl.triggerEmergencyLockdown);

// 3. Self-Healing AIOps
router.get("/self-healing/status", innovationCtrl.getSelfHealingStatus);
router.post("/self-healing/simulate-chaos", authenticate, innovationCtrl.simulateChaos);
router.post("/self-healing/execute-playbook", authenticate, innovationCtrl.executePlaybook);

module.exports = router;
