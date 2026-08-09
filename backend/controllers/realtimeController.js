const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let clients = [];

/**
 * GET /api/realtime/:userId
 * Server-Sent Events (SSE) connection handler for clients (extension and dashboard).
 */
function handleRealtime(req, res) {
  const { userId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    userId,
    res
  };

  clients.push(newClient);
  console.log(`[Realtime Sync] Connected client ${clientId} for user ${userId}`);

  // Send initial data immediately
  sendUpdateToUser(userId);

  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
    console.log(`[Realtime Sync] Disconnected client ${clientId} for user ${userId}`);
  });
}

/**
 * Pushes the latest unique website and exposure counts to all connected clients for a user.
 */
async function sendUpdateToUser(userId) {
  try {
    const records = await prisma.websiteRecord.findMany({
      where: { userId }
    });

    const websiteCount = records.length;
    const exposureCount = records.filter(r => r.loginDetected).length;

    const payload = JSON.stringify({
      websiteCount,
      exposureCount,
      records: records.map(r => {
        let parsedReasons = [];
        try {
          parsedReasons = JSON.parse(r.riskReasons || '[]');
        } catch (e) {}
        return {
          domain: r.domain,
          displayName: r.displayName,
          loginDetected: r.loginDetected,
          riskScore: r.riskScore,
          riskLevel: r.riskLevel,
          riskReasons: parsedReasons
        };
      })
    });
    console.log(`[Realtime Sync] Broadcasting updates to user ${userId}:`, payload);

    clients.forEach(client => {
      if (client.userId === userId) {
        client.res.write(`data: ${payload}\n\n`);
      }
    });
  } catch (err) {
    console.error(`[Realtime Sync] Error sending update to user ${userId}:`, err);
  }
}

module.exports = {
  handleRealtime,
  sendUpdateToUser
};
