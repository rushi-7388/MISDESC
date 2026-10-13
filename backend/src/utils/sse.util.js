const clients = new Set();

function initSse(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable buffering in Nginx
  res.flushHeaders?.();

  // Send initial connection handshake
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ message: "Connected to MISDESC Real-Time Event Stream", timestamp: new Date().toISOString() })}\n\n`);

  clients.add(res);

  // Keep-alive heartbeat every 15 seconds
  const heartbeat = setInterval(() => {
    res.write(`event: HEARTBEAT\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

function broadcastEvent(eventType, payload) {
  const dataString = JSON.stringify(payload || {});
  const message = `event: ${eventType}\ndata: ${dataString}\n\n`;

  for (const client of clients) {
    try {
      client.write(message);
    } catch (err) {
      clients.delete(client);
    }
  }
}

function getConnectedClientsCount() {
  return clients.size;
}

module.exports = {
  initSse,
  broadcastEvent,
  getConnectedClientsCount,
};
