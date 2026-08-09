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

    // Fetch all user data items, consents, privacy requests
    const dataItems = await prisma.dataItem.findMany({ where: { userId } });
    const consents = await prisma.consent.findMany({ where: { userId } });
    const requests = await prisma.privacyRequest.findMany({ where: { userId } });

    // Fetch user visited websites records as the single source of truth
    const userWebsites = await prisma.websiteRecord.findMany({ where: { userId } });
    const domains = userWebsites.map(w => w.domain);

    // Fetch details of those websites from the global Website catalog
    const websites = await prisma.website.findMany({
      where: { domain: { in: domains } }
    });

    const activeConsentsCount = await prisma.websiteRecord.count({
      where: { userId, loginDetected: true }
    });
    const pendingRequestsCount = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'AWAITING_RESPONSE').length;

    // Fetch nominees for trusted contact system
    const nominees = await prisma.nominee.findMany({ where: { userId } });

    // Fetch breaches affecting user's visited websites
    const websiteIds = websites.map(w => w.id);
    const breaches = await prisma.dataBreach.findMany({
      where: { websiteId: { in: websiteIds } },
      include: { website: true }
    });

    // Format digital footprint website grid data based on User's visited websites
    const formattedWebsites = userWebsites.map(userSite => {
      const site = websites.find(w => w.domain === userSite.domain) || {
        id: userSite.id,
        domain: userSite.domain,
        name: userSite.displayName,
        category: 'General',
        riskLevel: 'Medium',
        deletionTier: 2,
        directApiUrl: null,
        guidedUrl: `https://${userSite.domain}/privacy`,
        faviconUrl: null,
        isSDF: false
      };

      const siteDataItems = dataItems.filter(d => d.websiteId === site.id);
      const siteConsents = consents.filter(c => c.websiteId === site.id);
      const siteRequests = requests.filter(r => r.websiteId === site.id);

      const activeConsentNames = siteConsents
        .filter(c => c.status === 'ACTIVE')
        .map(c => c.consentType);

      // Fallback active consent name to display in the grid if login is detected but no consents logged
      if (userSite.loginDetected && activeConsentNames.length === 0) {
        activeConsentNames.push('Account Access');
      }

      let parsedReasons = [];
      try {
        parsedReasons = JSON.parse(userSite.riskReasons || '[]');
      } catch (e) {
        parsedReasons = [];
      }

      return {
        id: site.id,
        domain: site.domain,
        name: site.name,
        category: site.category,
        riskLevel: userSite.riskLevel || site.riskLevel || 'Medium',
        riskScore: userSite.riskScore,
        riskReasons: parsedReasons,
        deletionTier: site.deletionTier,
        directApiUrl: site.directApiUrl,
        guidedUrl: site.guidedUrl,
        faviconUrl: site.faviconUrl,
        isSDF: site.isSDF || false,
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
        privacyScore: currentPrivacyScore,
        isChild: user.isChild,
        parentEmail: user.parentEmail
      },
      stats: {
        totalWebsites: userWebsites.length,
        activeConsents: activeConsentsCount,
        pendingRequests: pendingRequestsCount
      },
      websites: formattedWebsites,
      nominees,
      breaches
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching dashboard data', error: error.message });
  }
};
