const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const tracerMiddleware = require("./middleware/tracer.middleware");
const chaosMiddleware = require("./middleware/chaos.middleware");

const authRoutes = require("./routes/auth.routes");
const chequeRoutes = require("./routes/cheque.routes");
const clearingRoutes = require("./routes/clearing.routes");
const settlementRoutes = require("./routes/settlement.routes");
const adminRoutes = require("./routes/admin.routes");
const batchRoutes = require("./routes/batch.routes");
const devopsRoutes = require("./routes/devops.routes");
const branchRoutes = require("./routes/branch.routes");
const rbacRoutes = require("./routes/rbac.routes");
const liquidityRoutes = require("./routes/liquidity.routes");
const disputeRoutes = require("./routes/dispute.routes");
const pkiRoutes = require("./routes/pki.routes");
const reconciliationRoutes = require("./routes/reconciliation.routes");
const hsmRoutes = require("./routes/hsm.routes");
const datacenterRoutes = require("./routes/datacenter.routes");
const swarmRoutes = require("./routes/swarm.routes");
const zkpRoutes = require("./routes/zkp.routes");
const smartchequeRoutes = require("./routes/smartcheque.routes");
const crossborderRoutes = require("./routes/crossborder.routes");
const stressRoutes = require("./routes/stress.routes");
const webhookRoutes = require("./routes/webhook.routes");
const reportRoutes = require("./routes/report.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(tracerMiddleware);
app.use(chaosMiddleware);
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

const { initSse } = require("./utils/sse.util");

// Standard health endpoints
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Real-Time Server-Sent Events (SSE) Live Clearing Stream
app.get("/api/events", initSse);

// Mount DevOps, Observability, Telemetry & Probes
app.use("/", devopsRoutes);
app.use("/api/devops", devopsRoutes);
app.use("/api/telemetry", devopsRoutes);

// Core Banking Routes
app.use("/api/auth", authRoutes);
app.use("/api/cheques", chequeRoutes);
app.use("/api/clearing", clearingRoutes);
app.use("/api/settlements", settlementRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/branch", branchRoutes);
app.use("/api/rbac", rbacRoutes);
app.use("/api/liquidity", liquidityRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/pki", pkiRoutes);
app.use("/api/reconciliation", reconciliationRoutes);
app.use("/api/hsm", hsmRoutes);
app.use("/api/datacenter", datacenterRoutes);
app.use("/api/swarm", swarmRoutes);
app.use("/api/zkp", zkpRoutes);
app.use("/api/smart-cheques", smartchequeRoutes);
app.use("/api/crossborder", crossborderRoutes);
app.use("/api/stress", stressRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/reports", reportRoutes);



app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[Error ID: ${req.id || "N/A"}]`, err);
  res.status(500).json({
    error: err.message || "Internal server error",
    correlationId: req.id,
  });
});

module.exports = app;
