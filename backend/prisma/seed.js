const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runSeed(prismaInstance) {
  const db = prismaInstance || prisma;
  console.log('🌱 Starting PrivacyLens Database Seed...');

  // Clean existing database records
  await db.auditLog.deleteMany();
  await db.privacyRequest.deleteMany();
  await db.consent.deleteMany();
  await db.dataItem.deleteMany();
  await db.website.deleteMany();
  await db.user.deleteMany();

  // 1. Create Default Primary Demo User
  const user = await db.user.create({
    data: {
      id: 'usr_12345',
      name: 'Joshua',
      email: 'joshua@example.com',
      passwordHash: '$2b$10$e8w3n3G9Q7m4.L.8j3x7u.v6R7N1jQ4M9p8r2W7',
      privacyScore: 72
    }
  });
  console.log(`👤 Created Demo User: ${user.name} (${user.email})`);

  // 2. Create Websites with 3 Deletion Tiers
  const shopEase = await db.website.create({
    data: {
      id: 'web_shopease',
      domain: 'shopease.com',
      name: 'ShopEase',
      category: 'E-Commerce',
      riskLevel: 'Medium',
      deletionTier: 1, // Tier 1: Direct API
      directApiUrl: 'http://localhost:3000/api/partner/revoke',
      guidedUrl: 'http://localhost:3000/account'
    }
  });

  const socialHub = await db.website.create({
    data: {
      id: 'web_socialhub',
      domain: 'socialhub.io',
      name: 'SocialHub',
      category: 'Social Network',
      riskLevel: 'High',
      deletionTier: 2, // Tier 2: Guided URL
      guidedUrl: 'https://socialhub.io/settings/privacy/delete'
    }
  });

  const cloudData = await db.website.create({
    data: {
      id: 'web_clouddata',
      domain: 'clouddata.net',
      name: 'CloudData Services',
      category: 'Cloud Storage',
      riskLevel: 'Low',
      deletionTier: 3 // Tier 3: DPDP Legal Notice Generator
    }
  });

  const quickBuy = await db.website.create({
    data: {
      id: 'web_quickbuy',
      domain: 'quickbuy.in',
      name: 'QuickBuy Retail',
      category: 'E-Commerce',
      riskLevel: 'Medium',
      deletionTier: 1,
      directApiUrl: 'http://localhost:3000/api/partner/revoke'
    }
  });

  console.log('🌐 Created Websites across Tiers 1, 2, and 3');

  // 3. Create Data Items Shared with Websites
  await db.dataItem.createMany({
    data: [
      { userId: user.id, websiteId: shopEase.id, dataType: 'Email' },
      { userId: user.id, websiteId: shopEase.id, dataType: 'Phone' },
      { userId: user.id, websiteId: shopEase.id, dataType: 'Name' },

      { userId: user.id, websiteId: socialHub.id, dataType: 'Email' },
      { userId: user.id, websiteId: socialHub.id, dataType: 'Name' },
      { userId: user.id, websiteId: socialHub.id, dataType: 'Location' },

      { userId: user.id, websiteId: cloudData.id, dataType: 'Email' },
      { userId: user.id, websiteId: cloudData.id, dataType: 'Phone' },

      { userId: user.id, websiteId: quickBuy.id, dataType: 'Email' }
    ]
  });

  // 4. Create Active and Revoked Consents
  await db.consent.createMany({
    data: [
      { userId: user.id, websiteId: shopEase.id, consentType: 'Account Creation', status: 'ACTIVE' },
      { userId: user.id, websiteId: shopEase.id, consentType: 'Marketing Emails', status: 'ACTIVE' },
      { userId: user.id, websiteId: shopEase.id, consentType: '3rd-Party Ads', status: 'ACTIVE' },

      { userId: user.id, websiteId: socialHub.id, consentType: 'Account Creation', status: 'ACTIVE' },
      { userId: user.id, websiteId: socialHub.id, consentType: 'Targeted Advertising', status: 'ACTIVE' },

      { userId: user.id, websiteId: cloudData.id, consentType: 'Account Creation', status: 'ACTIVE' },
      { userId: user.id, websiteId: cloudData.id, consentType: 'Promotional Updates', status: 'REVOKED', revokedAt: new Date(Date.now() - 86400000) }
    ]
  });

  // 5. Create Initial Privacy Requests
  await db.privacyRequest.create({
    data: {
      userId: user.id,
      websiteId: shopEase.id,
      requestType: 'CONSENT_REVOCATION',
      status: 'COMPLETED',
      methodUsed: 'TIER1_DIRECT_API',
      requestText: 'Marketing Emails consent revoked via Tier 1 direct API integration.'
    }
  });

  await db.privacyRequest.create({
    data: {
      userId: user.id,
      websiteId: socialHub.id,
      requestType: 'ACCOUNT_DELETION',
      status: 'AWAITING_RESPONSE',
      methodUsed: 'TIER2_GUIDED',
      requestText: 'Guided deletion drawer opened at https://socialhub.io/settings/privacy/delete.'
    }
  });

  // 6. Create Chronological Audit Logs
  await db.auditLog.createMany({
    data: [
      {
        userId: user.id,
        websiteId: shopEase.id,
        action: 'EVENT_DETECTED',
        description: 'Passive MV3 Extension detected account creation and marketing consents on ShopEase.',
        timestamp: new Date(Date.now() - 172800000)
      },
      {
        userId: user.id,
        websiteId: socialHub.id,
        action: 'EVENT_DETECTED',
        description: 'Passive MV3 Extension detected profile creation and location sharing on SocialHub.',
        timestamp: new Date(Date.now() - 129600000)
      },
      {
        userId: user.id,
        websiteId: shopEase.id,
        action: 'CONSENT_REVOKED',
        description: 'User triggered Tier 1 direct API consent revocation for Marketing Emails on ShopEase.',
        timestamp: new Date(Date.now() - 86400000)
      },
      {
        userId: user.id,
        websiteId: cloudData.id,
        action: 'DELETION_REQUESTED',
        description: 'DPDP Section 12 legal request generated for CloudData Services.',
        timestamp: new Date(Date.now() - 43200000)
      }
    ]
  });

  // 7. Create Visited WebsiteRecords
  await db.websiteRecord.createMany({
    data: [
      {
        userId: user.id,
        domain: 'shopease.com',
        displayName: 'ShopEase',
        loginDetected: true,
        firstSeenAt: new Date(Date.now() - 172800000),
        lastSeenAt: new Date(Date.now() - 86400000)
      },
      {
        userId: user.id,
        domain: 'socialhub.io',
        displayName: 'SocialHub',
        loginDetected: true,
        firstSeenAt: new Date(Date.now() - 129600000),
        lastSeenAt: new Date(Date.now() - 129600000)
      },
      {
        userId: user.id,
        domain: 'clouddata.net',
        displayName: 'CloudData Services',
        loginDetected: true,
        firstSeenAt: new Date(Date.now() - 43200000),
        lastSeenAt: new Date(Date.now() - 43200000)
      },
      {
        userId: user.id,
        domain: 'quickbuy.in',
        displayName: 'QuickBuy Retail',
        loginDetected: false,
        firstSeenAt: new Date(Date.now() - 21600000),
        lastSeenAt: new Date(Date.now() - 21600000)
      }
    ]
  });

  console.log('✅ Database Seeding Completed Successfully!');
}

if (require.main === module) {
  runSeed()
    .catch((e) => {
      console.error('❌ Seeding Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { runSeed };

