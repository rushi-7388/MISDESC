const messagingService = require("../services/messaging.service");

/**
 * Controller for WhatsApp Banking & SMS Multi-Channel Gateway
 */

async function getLogs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || "50", 10);
    const channel = req.query.channel || null;
    const logs = messagingService.getMessageLogs(limit, channel);
    return res.json({ count: logs.length, logs });
  } catch (err) {
    next(err);
  }
}

async function getTemplates(req, res, next) {
  try {
    return res.json({ templates: messagingService.TEMPLATES });
  } catch (err) {
    next(err);
  }
}

async function sendSms(req, res, next) {
  try {
    const { recipient, templateKey, params, customBody, customerName } = req.body;
    const result = await messagingService.sendSms({
      recipient,
      templateKey,
      params,
      customBody,
      customerName,
    });
    return res.status(201).json({
      message: "SMS notification dispatched successfully via DLT telecom route.",
      sms: result,
    });
  } catch (err) {
    next(err);
  }
}

async function sendWhatsApp(req, res, next) {
  try {
    const { recipient, templateKey, params, customBody, customerName } = req.body;
    const result = await messagingService.sendWhatsApp({
      recipient,
      templateKey,
      params,
      customBody,
      customerName,
    });
    return res.status(201).json({
      message: "WhatsApp notification dispatched successfully.",
      whatsapp: result,
    });
  } catch (err) {
    next(err);
  }
}

async function simulateWhatsAppIncoming(req, res, next) {
  try {
    const { message, senderPhone } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message text is required" });
    }
    const result = await messagingService.processIncomingWhatsAppMessage(
      message,
      senderPhone || "+91 98251 44012"
    );
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Meta WhatsApp Cloud API Webhook Verification (Free Tier Sandbox)
 */
function verifyMetaWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const config = messagingService.getGatewayConfig();

  if (mode && token) {
    if (mode === "subscribe" && token === config.metaVerifyToken) {
      console.log("[Meta Webhook] Verification Token Verified Successfully.");
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  return res.sendStatus(400);
}

/**
 * Meta WhatsApp Cloud API Inbound Webhook Event Handler
 */
async function handleMetaWebhook(req, res, next) {
  try {
    const body = req.body;
    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const messageObj = changes?.value?.messages?.[0];

      if (messageObj && messageObj.text?.body) {
        const incomingText = messageObj.text.body;
        const from = messageObj.from;
        console.log(`[Meta Inbound] Received WhatsApp message from ${from}: ${incomingText}`);

        // Process message through conversational bot
        await messagingService.processIncomingWhatsAppMessage(incomingText, `+${from}`);
      }
      return res.status(200).send("EVENT_RECEIVED");
    }
    return res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}

function getClickToChat(req, res) {
  const { phone, message } = req.query;
  const link = messagingService.generateClickToChatLink(phone, message);
  return res.json({
    link,
    qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(link)}`,
  });
}

function getConfig(req, res) {
  return res.json(messagingService.getGatewayConfig());
}

function updateConfig(req, res) {
  const updated = messagingService.updateGatewayConfig(req.body);
  return res.json({ message: "Gateway configuration updated", config: updated });
}

async function broadcastBatch(req, res, next) {
  try {
    const { batchId } = req.params;
    const result = await messagingService.broadcastBatchClearingNotifications(batchId);
    return res.json({
      message: `Dispatched ${result.count} SMS and WhatsApp alerts for batch ${batchId}.`,
      result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLogs,
  getTemplates,
  sendSms,
  sendWhatsApp,
  simulateWhatsAppIncoming,
  verifyMetaWebhook,
  handleMetaWebhook,
  getClickToChat,
  getConfig,
  updateConfig,
  broadcastBatch,
};
