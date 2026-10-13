const webhookService = require("../services/webhook.service");
const { OPENAPI_SPEC } = require("../utils/openapi.util");

async function listSubscriptions(req, res, next) {
  try {
    const subs = await webhookService.listSubscriptions();
    return res.json(subs);
  } catch (err) {
    next(err);
  }
}

async function createSubscription(req, res, next) {
  try {
    const sub = await webhookService.createSubscription(req.body);
    return res.status(201).json(sub);
  } catch (err) {
    next(err);
  }
}

async function deleteSubscription(req, res, next) {
  try {
    const result = await webhookService.deleteSubscription(req.params.id);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function testDispatch(req, res, next) {
  try {
    const { eventType = "CHEQUE_PRESENTED", payload } = req.body;
    const testPayload = payload || {
      chequeNumber: "000456",
      amount: 150000,
      draweeBank: "HDFC0005678",
      presentingBank: "SBIN0001234",
      ppsStatus: "PPS_VERIFIED",
    };

    const result = await webhookService.dispatchWebhookEvent(eventType, testPayload);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listDeliveries(req, res, next) {
  try {
    const limit = Number(req.query.limit || 25);
    const deliveries = await webhookService.listDeliveries(limit);
    return res.json(deliveries);
  } catch (err) {
    next(err);
  }
}

function getOpenApiSpec(req, res) {
  return res.json(OPENAPI_SPEC);
}

module.exports = {
  listSubscriptions,
  createSubscription,
  deleteSubscription,
  testDispatch,
  listDeliveries,
  getOpenApiSpec,
};
