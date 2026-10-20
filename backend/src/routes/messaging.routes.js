const express = require("express");
const router = express.Router();
const messagingCtrl = require("../controllers/messaging.controller");
const { authenticate } = require("../middleware/auth.middleware");

// Public Webhooks for Meta Cloud API & Twilio (Free tier callback endpoints)
router.get("/whatsapp/webhook", messagingCtrl.verifyMetaWebhook);
router.post("/whatsapp/webhook", messagingCtrl.handleMetaWebhook);

// Public / Demo simulator endpoint for instant two-way chat test
router.post("/whatsapp/simulate-incoming", messagingCtrl.simulateWhatsAppIncoming);
router.get("/whatsapp/click-to-chat", messagingCtrl.getClickToChat);

// Authenticated or operational endpoints
router.get("/logs", messagingCtrl.getLogs);
router.get("/templates", messagingCtrl.getTemplates);
router.get("/config", messagingCtrl.getConfig);
router.post("/config", authenticate, messagingCtrl.updateConfig);
router.post("/send-sms", authenticate, messagingCtrl.sendSms);
router.post("/send-whatsapp", authenticate, messagingCtrl.sendWhatsApp);
router.post("/broadcast-batch/:batchId", authenticate, messagingCtrl.broadcastBatch);

module.exports = router;
