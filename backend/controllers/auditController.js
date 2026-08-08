const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/audit/:userId
 * Returns chronological audit trail logs for the specified user.
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { userId: paramUserId } = req.params;

    let user = null;
    if (paramUserId && paramUserId !== 'default') {
      user = await prisma.user.findUnique({ where: { id: paramUserId } });
    }
    if (!user) {
      user = await prisma.user.findFirst({ where: { email: 'joshua@example.com' } });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { userId: user.id },
      include: {
        website: {
          select: { id: true, name: true, domain: true, faviconUrl: true, deletionTier: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    return res.status(200).json({
      success: true,
      userId: user.id,
      count: auditLogs.length,
      auditLogs: auditLogs.map(log => ({
        id: log.id,
        websiteId: log.websiteId,
        websiteName: log.website.name,
        websiteDomain: log.website.domain,
        action: log.action,
        description: log.description,
        timestamp: log.timestamp
      }))
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ success: false, message: 'Error fetching audit logs', error: error.message });
  }
};
