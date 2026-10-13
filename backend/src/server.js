require("dotenv").config();
const app = require("./app");
const prisma = require("./config/prisma");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`MISDESC backend running on http://localhost:${PORT}`);
  console.log(`DevOps & SRE Probes: /health/live, /health/ready, /metrics`);
});

// Production Graceful Shutdown Handlers
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    console.log("HTTP server closed. Disconnecting database connections...");
    try {
      await prisma.$disconnect();
      console.log("Database connections closed cleanly. Process exiting.");
      process.exit(0);
    } catch (err) {
      console.error("Error during database disconnect:", err);
      process.exit(1);
    }
  });

  // Force exit if connections fail to close within 10s
  setTimeout(() => {
    console.error("Graceful shutdown timeout exceeded. Forcefully terminating process.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

module.exports = server;
