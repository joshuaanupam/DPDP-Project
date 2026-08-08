const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateAndSavePrivacyScore } = require('../utils/privacyScore');

/**
 * GET /api/dashboard/:userId
 * Returns user details, summary stats, digital footprint websites list, active consents, pending requests.
 */
exports.getDashboardData = async (req, res) => {
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
      user = await prisma.user.findFirst();
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userId = user.id;

    // Recalculate privacy score dynamically
    const currentPrivacyScore = await calculateAndSavePrivacyScore(prisma, userId);

    // Fetch all user data items, consents, privacy requests, and associated websites
    const dataItems = await prisma.dataItem.findMany({ where: { userId } });
    const consents = await prisma.consent.findMany({ where: { userId } });
    const requests = await prisma.privacyRequest.findMany({ where: { userId } });

    // Collect all distinct website IDs
    const websiteIdsSet = new Set([
      ...dataItems.map(d => d.websiteId),
      ...consents.map(c => c.websiteId),
      ...requests.map(r => r.websiteId)
    ]);
    const websiteIds = Array.from(websiteIdsSet);

    const websites = await prisma.website.findMany({
      where: { id: { in: websiteIds } }
    });

    const activeConsentsCount = consents.filter(c => c.status === 'ACTIVE').length;
    const pendingRequestsCount = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'AWAITING_RESPONSE').length;

    // Format digital footprint website grid data
    const formattedWebsites = websites.map(site => {
      const siteDataItems = dataItems.filter(d => d.websiteId === site.id);
      const siteConsents = consents.filter(c => c.websiteId === site.id);
      const siteRequests = requests.filter(r => r.websiteId === site.id);

      const activeConsentNames = siteConsents
        .filter(c => c.status === 'ACTIVE')
        .map(c => c.consentType);

      return {
        id: site.id,
        domain: site.domain,
        name: site.name,
        category: site.category,
        riskLevel: site.riskLevel,
        deletionTier: site.deletionTier,
        directApiUrl: site.directApiUrl,
        guidedUrl: site.guidedUrl,
        faviconUrl: site.faviconUrl,
        dataItems: siteDataItems.map(d => d.dataType),
        activeConsents: activeConsentNames,
        consents: siteConsents.map(c => ({
          id: c.id,
          consentType: c.consentType,
          status: c.status,
          grantedAt: c.grantedAt,
          revokedAt: c.revokedAt
        })),
        requests: siteRequests.map(r => ({
          id: r.id,
          requestType: r.requestType,
          status: r.status,
          methodUsed: r.methodUsed,
          requestText: r.requestText,
          createdAt: r.createdAt
        }))
      };
    });

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        privacyScore: currentPrivacyScore
      },
      stats: {
        totalWebsites: websites.length,
        activeConsents: activeConsentsCount,
        pendingRequests: pendingRequestsCount
      },
      websites: formattedWebsites
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching dashboard data', error: error.message });
  }
};
