const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/websites/:websiteId
 * Returns detailed information for a specific website, including data items and active consents.
 */
exports.getWebsiteDetail = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const userId = req.query.userId || 'usr_12345';

    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      include: {
        dataItems: { where: { userId } },
        consents: { where: { userId } },
        requests: { where: { userId } }
      }
    });

    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    return res.status(200).json({
      success: true,
      website: {
        id: website.id,
        domain: website.domain,
        name: website.name,
        category: website.category,
        riskLevel: website.riskLevel,
        deletionTier: website.deletionTier,
        directApiUrl: website.directApiUrl,
        guidedUrl: website.guidedUrl,
        dataItems: website.dataItems.map(d => d.dataType),
        consents: website.consents,
        requests: website.requests
      }
    });
  } catch (error) {
    console.error('Error fetching website detail:', error);
    return res.status(500).json({ success: false, message: 'Error fetching website detail', error: error.message });
  }
};
