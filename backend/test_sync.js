const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSync() {
  console.log('--- STARTING VERIFICATION TEST ---');
  const userId = 'usr_12345';

  // 1. Check initial counts
  let websites = await prisma.websiteRecord.findMany({ where: { userId } });
  console.log(`Initial Website count: ${websites.length} (Expected: 4)`);
  let exposures = await prisma.websiteRecord.count({ where: { userId, loginDetected: true } });
  console.log(`Initial Exposure count: ${exposures} (Expected: 3)`);

  // 2. Simulate new website visit via fetch to POST /api/events
  console.log('\nSimulating visit to a new website: netflix.com...');
  const visitPayload = {
    userId,
    domain: 'netflix.com',
    siteName: 'Netflix',
    eventType: 'WEBSITE_VISIT',
    timestamp: new Date().toISOString()
  };

  const visitRes = await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visitPayload)
  });

  if (visitRes.ok) {
    console.log('Visit event processed by backend successfully.');
  } else {
    console.error('Failed to process visit event:', visitRes.status, await visitRes.text());
  }

  // 3. Verify database updated
  websites = await prisma.websiteRecord.findMany({ where: { userId } });
  console.log(`Post-visit Website count: ${websites.length} (Expected: 5)`);
  let netflixRecord = await prisma.websiteRecord.findUnique({
    where: { userId_domain: { userId, domain: 'netflix.com' } }
  });
  console.log(`Netflix record found in DB: ${!!netflixRecord}`);
  console.log(`Netflix loginDetected: ${netflixRecord?.loginDetected} (Expected: false)`);

  // 4. Simulate login event for netflix.com
  console.log('\nSimulating login to netflix.com...');
  const loginPayload = {
    userId,
    domain: 'netflix.com',
    siteName: 'Netflix',
    eventType: 'ACCOUNT_CREATED',
    timestamp: new Date().toISOString(),
    detectedFields: ['email', 'password'],
    consents: [{ consentType: 'Account Access', granted: true }]
  };

  const loginRes = await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginPayload)
  });

  if (loginRes.ok) {
    console.log('Login event processed by backend successfully.');
  } else {
    console.error('Failed to process login event:', loginRes.status, await loginRes.text());
  }

  // 5. Verify database exposure updated
  exposures = await prisma.websiteRecord.count({ where: { userId, loginDetected: true } });
  console.log(`Post-login Exposure count: ${exposures} (Expected: 4)`);
  netflixRecord = await prisma.websiteRecord.findUnique({
    where: { userId_domain: { userId, domain: 'netflix.com' } }
  });
  console.log(`Netflix loginDetected post-login: ${netflixRecord?.loginDetected} (Expected: true)`);

  // 6. Simulate duplicate login event for netflix.com to test deduplication
  console.log('\nSimulating duplicate login to netflix.com...');
  const duplicateRes = await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginPayload)
  });

  if (duplicateRes.ok) {
    console.log('Duplicate login event processed by backend successfully.');
  }

  exposures = await prisma.websiteRecord.count({ where: { userId, loginDetected: true } });
  console.log(`Post-duplicate Exposure count: ${exposures} (Expected: 4)`);

  console.log('--- VERIFICATION TEST COMPLETED ---');
  await prisma.$disconnect();
}

testSync().catch(err => {
  console.error('Error during verification test:', err);
  prisma.$disconnect();
});
