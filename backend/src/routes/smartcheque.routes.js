const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
  earmarkLien,
  getContract,
  releaseMilestone,
  settleCbdc,
  handleIotTriggerWebhook,
  executeTaxSplit,
  verifyGeofence,
} = require("../controllers/smartcheque.controller");

const router = express.Router();

// Public / Signature-authenticated IoT Telematics Webhook (e-Way Bill / Commercial Delivery Trigger)
router.post("/webhooks/iot-trigger", handleIotTriggerWebhook);

// Programmable CBDC Tax Split & Geofence (Accessible for simulation / bank auth)
router.post("/tax-split", executeTaxSplit);
router.post("/geofence-verify", verifyGeofence);

// Protected routes requiring bank session
router.use(authenticate);

// Programmable Smart Cheques & Micro-Lien Endpoints
router.post("/lien/earmark", earmarkLien);
router.get("/contracts/:chequeId", getContract);
router.get("/contract/:chequeId", getContract);
router.get("/contraMISDESC/:chequeId", getContract);
router.post("/contracts/:chequeId/release-milestone", releaseMilestone);
router.post("/contract/:chequeId/release-milestone", releaseMilestone);
router.post("/contraMISDESC/:chequeId/release-milestone", releaseMilestone);
router.post("/cbdc/settle", settleCbdc);

module.exports = router;


