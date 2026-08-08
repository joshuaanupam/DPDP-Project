const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateAndSavePrivacyScore } = require('../utils/privacyScore');

/**
 * POST /api/requests/create
 * Processes Tier 1 (Direct API), Tier 2 (Guided URL), and Tier 3 (Legal Notice) requests.
 */
exports.createPrivacyRequest = async (req, res) => {
  try {
    const { userId: reqUserId, websiteId, requestType = 'CONSENT_REVOCATION', targetConsent, tier, methodUsed: reqMethod, requestText } = req.body;

    if (!websiteId) {
      return res.status(400).json({ success: false, message: 'Website ID is required.' });
    }

    // Determine target user
    let user = null;
    if (reqUserId) {
      user = await prisma.user.findUnique({ where: { id: reqUserId } });
    }
    if (!user) {
      user = await prisma.user.findFirst({ where: { email: 'joshua@example.com' } });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const userId = user.id;

    // Fetch Website
    const website = await prisma.website.findUnique({ where: { id: websiteId } });
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found.' });
    }

    // Determine Tier / Method
    const effectiveTier = tier || (reqMethod === 'TIER1_DIRECT_API' ? 1 : reqMethod === 'TIER2_GUIDED' ? 2 : reqMethod === 'TIER3_GENERATED_NOTICE' ? 3 : website.deletionTier || 2);
    const methodUsed = reqMethod || (effectiveTier === 1 ? 'TIER1_DIRECT_API' : effectiveTier === 2 ? 'TIER2_GUIDED' : 'TIER3_GENERATED_NOTICE');

    let requestStatus = 'SUBMITTED';
    let message = '';
    let partnerApiResponse = null;

    if (effectiveTier === 1) {
      // Tier 1: Direct API execution
      requestStatus = 'COMPLETED';

      // If website has a partner direct API URL (e.g. ShopEase at http://localhost:3000/api/partner/revoke), attempt to call it
      if (website.directApiUrl) {
        try {
          const partnerRes = await fetch(website.directApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userEmail: user.email, targetConsent, requestType })
          });
          partnerApiResponse = await partnerRes.json();
        } catch (fetchErr) {
          console.warn('Partner API fetch failed, proceeding with local database state update:', fetchErr.message);
        }
      }

      // Update matching consents in database to REVOKED
      if (targetConsent) {
        await prisma.consent.updateMany({
          where: { userId, websiteId: website.id, consentType: targetConsent },
          data: { status: 'REVOKED', revokedAt: new Date() }
        });
      } else {
        // Revoke marketing/promotional consents by default
        await prisma.consent.updateMany({
          where: {
            userId,
            websiteId: website.id,
            status: 'ACTIVE'
          },
          data: { status: 'REVOKED', revokedAt: new Date() }
        });
      }

      message = `${targetConsent || 'Consent'} revoked via Tier 1 Direct API on ${website.name}.`;

      // Log Audit Entry
      const auditLog = await prisma.auditLog.create({
        data: {
          userId,
          websiteId: website.id,
          action: 'CONSENT_REVOKED',
          description: `Tier 1 Direct API execution: ${targetConsent || 'All marketing consents'} revoked on ${website.name}.`
        }
      });

      // Recalculate privacy score
      const updatedPrivacyScore = await calculateAndSavePrivacyScore(prisma, userId);

      // Create PrivacyRequest record
      const privacyRequest = await prisma.privacyRequest.create({
        data: {
          userId,
          websiteId: website.id,
          requestType,
          status: requestStatus,
          methodUsed,
          requestText: requestText || message
        }
      });

      return res.status(200).json({
        success: true,
        requestId: privacyRequest.id,
        status: requestStatus,
        auditLogId: auditLog.id,
        updatedPrivacyScore,
        message,
        partnerApiResponse
      });
    } else if (effectiveTier === 2) {
      // Tier 2: Guided URL Drawer
      requestStatus = 'SUBMITTED';
      message = `Guided action initiated for ${website.name}. Direct privacy URL: ${website.guidedUrl || `https://${website.domain}/privacy`}`;

      const privacyRequest = await prisma.privacyRequest.create({
        data: {
          userId,
          websiteId: website.id,
          requestType,
          status: requestStatus,
          methodUsed,
          requestText: requestText || message
        }
      });

      const auditLog = await prisma.auditLog.create({
        data: {
          userId,
          websiteId: website.id,
          action: 'GUIDED_ACTION_LAUNCHED',
          description: `Tier 2 Guided drawer launched for ${website.name}. Link: ${website.guidedUrl || `https://${website.domain}/privacy`}`
        }
      });

      return res.status(200).json({
        success: true,
        requestId: privacyRequest.id,
        status: requestStatus,
        guidedUrl: website.guidedUrl || `https://${website.domain}/privacy`,
        auditLogId: auditLog.id,
        message
      });
    } else {
      // Tier 3: Generated Legal Notice (DPDP §12 Erasure / §6 Revocation)
      requestStatus = 'SUBMITTED';
      const defaultNotice = `Formal DPDP Act 2023 Notice to ${website.name} (${website.domain}):\nUnder Section 12 (Data Erasure) and Section 6 (Consent Withdrawal), I hereby withdraw consent for processing and request complete erasure of all personal data associated with email ${user.email}.`;
      const finalNoticeText = requestText || defaultNotice;

      const privacyRequest = await prisma.privacyRequest.create({
        data: {
          userId,
          websiteId: website.id,
          requestType,
          status: requestStatus,
          methodUsed,
          requestText: finalNoticeText
        }
      });

      const auditLog = await prisma.auditLog.create({
        data: {
          userId,
          websiteId: website.id,
          action: 'DELETION_REQUESTED',
          description: `Tier 3 DPDP §12 legal request generated and logged for ${website.name}.`
        }
      });

      return res.status(200).json({
        success: true,
        requestId: privacyRequest.id,
        status: requestStatus,
        auditLogId: auditLog.id,
        requestText: finalNoticeText,
        message: `Tier 3 DPDP legal notice created and logged for ${website.name}.`
      });
    }
  } catch (error) {
    console.error('Error creating privacy request:', error);
    return res.status(500).json({ success: false, message: 'Server error creating request', error: error.message });
  }
};

/**
 * GET /api/requests/:userId
 * Returns list of user's privacy requests for Request Tracker table.
 */
exports.getUserRequests = async (req, res) => {
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

    const requests = await prisma.privacyRequest.findMany({
      where: { userId: user.id },
      include: { website: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      requests: requests.map(r => ({
        id: r.id,
        websiteId: r.websiteId,
        websiteName: r.website.name,
        websiteDomain: r.website.domain,
        requestType: r.requestType,
        status: r.status,
        methodUsed: r.methodUsed,
        requestText: r.requestText,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return res.status(500).json({ success: false, message: 'Error fetching requests', error: error.message });
  }
};

/**
 * POST /api/requests/:requestId/status
 * Updates status of an existing request (e.g., SUBMITTED -> AWAITING_RESPONSE -> COMPLETED).
 */
exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const existingRequest = await prisma.privacyRequest.findUnique({
      where: { id: requestId },
      include: { website: true }
    });

    if (!existingRequest) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const updatedRequest = await prisma.privacyRequest.update({
      where: { id: requestId },
      data: { status }
    });

    // Log audit entry
    await prisma.auditLog.create({
      data: {
        userId: existingRequest.userId,
        websiteId: existingRequest.websiteId,
        action: 'STATUS_UPDATED',
        description: `Privacy request for ${existingRequest.website.name} updated to ${status}.`
      }
    });

    return res.status(200).json({
      success: true,
      request: updatedRequest,
      message: `Request status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    return res.status(500).json({ success: false, message: 'Error updating request status', error: error.message });
  }
};
