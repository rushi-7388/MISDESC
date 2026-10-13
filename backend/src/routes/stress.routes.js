const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  generateBatch,
  runBenchmark,
  getTelemetry,
} = require("../controllers/stress.controller");

const router = express.Router();

router.use(authenticate);

// Phase 9: High-Throughput Stress Engine & Real-Time Telemetry
router.post("/generate-batch", authorize("ADMIN", "SETTLEMENT_OFFICER", "BRANCH_MANAGER"), generateBatch);
router.post("/run-benchmark", authorize("ADMIN", "SETTLEMENT_OFFICER"), runBenchmark);
router.get("/telemetry", getTelemetry);

module.exports = router;
