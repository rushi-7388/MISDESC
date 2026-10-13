const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  listSubscriptions,
  createSubscription,
  deleteSubscription,
  testDispatch,
  listDeliveries,
  getOpenApiSpec,
} = require("../controllers/webhook.controller");

const router = express.Router();

// OpenAPI Spec is public for developer exploration
router.get("/openapi.json", getOpenApiSpec);

router.use(authenticate);

// Phase 10: Multi-Tenant Core Banking Webhook Gateway
router.get("/", listSubscriptions);
router.post("/", authorize("ADMIN", "SETTLEMENT_OFFICER"), createSubscription);
router.delete("/:id", authorize("ADMIN", "SETTLEMENT_OFFICER"), deleteSubscription);
router.post("/test-dispatch", authorize("ADMIN", "SETTLEMENT_OFFICER", "BRANCH_MANAGER"), testDispatch);
router.get("/deliveries", listDeliveries);

module.exports = router;
