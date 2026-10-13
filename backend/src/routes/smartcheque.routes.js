const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
  earmarkLien,
  getContract,
  releaseMilestone,
  settleCbdc,
  handleIotTriggerWebhook,
} = require("../controllers/smartcheque.controller");

const router = express.Router();

// Public / Signature-authenticated IoT Telematics Webhook (e-Way Bill / Commercial Delivery Trigger)
router.post("/webhooks/iot-trigger", handleIotTriggerWebhook);

// Protected routes requiring bank session
router.use(authenticate);

// Programmable Smart Cheques & Micro-Lien Endpoints
router.post("/lien/earmark", earmarkLien);
router.get("/contraMISDESC/:chequeId", getContract);
router.post("/contraMISDESC/:chequeId/release-milestone", releaseMilestone);
router.post("/cbdc/settle", settleCbdc);

module.exports = router;

