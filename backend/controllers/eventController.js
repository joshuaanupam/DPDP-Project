const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateAndSavePrivacyScore } = require('../utils/privacyScore');

/**
 * POST /api/events
 * Receives extension event payloads, upserts website, data items, and consents.
 * Calculates new privacy score and logs audit entry.
 */
exports.handleEvent = async (req, res) => {
  try {
    const { userId: reqUserId, domain, siteName, detectedFields = [], consents = [] } = req.body;

    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required.' });
    }

    // Default to primary demo user if not provided
    const targetEmail = 'joshua@example.com';
    let user = null;
    if (reqUserId) {
      user = await prisma.user.findUnique({ where: { id: reqUserId } });
    }
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: targetEmail } });
    }
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: reqUserId || 'usr_12345',
          name: 'Joshua',
          email: targetEmail,
          passwordHash: 'hashed_demo_password',
          privacyScore: 85
        }
      });
    }

    const userId = user.id;
    const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const cleanSiteName = siteName || (normalizedDomain.includes('shopease') || normalizedDomain.includes('3000') ? 'ShopEase' : normalizedDomain);

    // Determine deletion tier & direct API URL for ShopEase demo
    const isShopEase = normalizedDomain.includes('shopease') || normalizedDomain.includes('3000');
    const deletionTier = isShopEase ? 1 : 2;
    const directApiUrl = isShopEase ? 'http://localhost:3000/api/partner/revoke' : null;
    const guidedUrl = isShopEase ? 'http://localhost:3000/account' : `https://${normalizedDomain}/privacy`;

    // Upsert Website
    const website = await prisma.website.upsert({
      where: { domain: normalizedDomain },
      update: {
        name: cleanSiteName,
        deletionTier: isShopEase ? 1 : undefined,
        directApiUrl: directApiUrl || undefined,
        guidedUrl: guidedUrl || undefined
      },
      create: {
        domain: normalizedDomain,
        name: cleanSiteName,
        category: isShopEase ? 'E-Commerce' : 'General',
        riskLevel: isShopEase ? 'Medium' : 'Medium',
        deletionTier: deletionTier,
        directApiUrl: directApiUrl,
        guidedUrl: guidedUrl
      }
    });

    // Create DataItems if not already existing
    for (const dataType of detectedFields) {
      const existing = await prisma.dataItem.findFirst({
        where: { userId, websiteId: website.id, dataType }
      });
      if (!existing) {
        await prisma.dataItem.create({
          data: {
            userId,
            websiteId: website.id,
            dataType
          }
        });
      }
    }

    // Upsert Consents
    for (const consentItem of consents) {
      const consentType = consentItem.consentType || consentItem.name || 'General Consent';
      const status = (consentItem.granted !== false) ? 'ACTIVE' : 'REVOKED';

      const existingConsent = await prisma.consent.findFirst({
        where: { userId, websiteId: website.id, consentType }
      });

      if (existingConsent) {
        await prisma.consent.update({
          where: { id: existingConsent.id },
          data: {
            status,
            revokedAt: status === 'REVOKED' ? new Date() : null
          }
        });
      } else {
        await prisma.consent.create({
          data: {
            userId,
            websiteId: website.id,
            consentType,
            status,
            grantedAt: new Date()
          }
        });
      }
    }

    // Recalculate privacy score
    const updatedPrivacyScore = await calculateAndSavePrivacyScore(prisma, userId);

    // Create Audit Log
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        websiteId: website.id,
        action: 'EVENT_DETECTED',
        description: `Privacy activity detected on ${website.name} (${website.domain}). Data types detected: ${detectedFields.join(', ') || 'None'}.`
      }
    });

    return res.status(201).json({
      success: true,
      eventId: auditLog.id,
      updatedPrivacyScore,
      websiteId: website.id,
      message: `Successfully processed event for ${website.name}`
    });
  } catch (error) {
    console.error('Error handling extension event:', error);
    return res.status(500).json({ success: false, message: 'Server error processing event', error: error.message });
  }
};
