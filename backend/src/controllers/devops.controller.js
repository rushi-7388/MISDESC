const prisma = require("../config/prisma");
const { getSreStats, getPrometheusMetrics } = require("../utils/metrics.util");
const { getChaosState, setChaosConfig, resetChaos } = require("../utils/chaos.util");

// Kubernetes Liveness Probe
function livenessProbe(req, res) {
  return res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
}

// Kubernetes Readiness Probe
async function readinessProbe(req, res) {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    return res.status(200).json({
      status: "READY",
      checks: {
        database: { status: "HEALTHY", latencyMs: dbLatencyMs },
        memory: { status: "HEALTHY", heapUsedMb: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)) },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      status: "NOT_READY",
      error: "Database connectivity check failed",
      details: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Prometheus raw metrics feed
async function prometheusFeed(req, res) {
  try {
    const metrics = await getPrometheusMetrics();
    res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    return res.send(metrics);
  } catch (err) {
    return res.status(500).send("Error collecting metrics: " + err.message);
  }
}

// SRE & Observability JSON stats for Frontend Hub
async function sreStats(req, res) {
  try {
    const stats = await getSreStats();
    const chaos = getChaosState();
    return res.json({ ...stats, chaos });
  } catch (err) {
    console.error("Failed to gather SRE stats:", err);
    return res.status(500).json({ error: "Failed to gather SRE stats" });
  }
}

// Ping database for live roundtrip measurement
async function dbPing(req, res) {
  const start = Date.now();
  try {
    const result = await prisma.$queryRaw`SELECT current_database(), now() as server_time`;
    const latencyMs = Date.now() - start;
    return res.json({
      success: true,
      latencyMs,
      database: result[0]?.current_database || "MISDESC_system",
      serverTime: result[0]?.server_time || new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      latencyMs: Date.now() - start,
      error: err.message,
    });
  }
}

// System Diagnostics and Deep Metadata
async function systemInfo(req, res) {
  try {
    const [chequeCount, bankCount, userCount, batchCount, telemetryCount] = await Promise.all([
      prisma.cheque.count(),
      prisma.bank.count(),
      prisma.user.count(),
      prisma.batch.count(),
      prisma.telemetryEvent.count(),
    ]);

    return res.json({
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || 5000,
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        pid: process.pid,
      },
      tableCounts: {
        cheques: chequeCount,
        banks: bankCount,
        users: userCount,
        batches: batchCount,
        telemetryEvents: telemetryCount,
      },
      database: {
        provider: "PostgreSQL",
        poolEngine: "Prisma Query Engine (libquery_engine-linux-musl / windows)",
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Chaos Controller handlers
function getChaos(req, res) {
  return res.json(getChaosState());
}

function updateChaos(req, res) {
  const updated = setChaosConfig(req.body);
  return res.json({ message: "Chaos configuration updated", state: updated });
}

function clearChaos(req, res) {
  const cleared = resetChaos();
  return res.json({ message: "Chaos state reset to normal", state: cleared });
}

// Telemetry Handlers
async function reportTelemetry(req, res) {
  try {
    const { source = "frontend", level = "error", message, stack, url, userAgent, context } = req.body;

    const event = await prisma.telemetryEvent.create({
      data: {
        source,
        level,
        message: message || "Unknown error",
        stack: stack ? String(stack).slice(0, 4000) : null,
        url,
        userAgent,
        context: context || {},
      },
    });

    return res.status(201).json({ success: true, eventId: event.id });
  } catch (err) {
    console.error("Failed to record telemetry:", err);
    return res.status(500).json({ error: "Failed to record telemetry" });
  }
}

async function recentTelemetry(req, res) {
  try {
    const events = await prisma.telemetryEvent.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load telemetry" });
  }
}

module.exports = {
  livenessProbe,
  readinessProbe,
  prometheusFeed,
  sreStats,
  dbPing,
  systemInfo,
  getChaos,
  updateChaos,
  clearChaos,
  reportTelemetry,
  recentTelemetry,
};
