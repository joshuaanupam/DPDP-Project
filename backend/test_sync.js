const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTestMatrix() {
  console.log('--- STARTING MULTI-LAYER RISK MATRIX TEST ---');
  const userId = 'usr_12345';

  // Cleanup past records for reliable test baseline
  await prisma.websiteRecord.deleteMany({ where: { userId, domain: { in: ['test-a.com', 'test-b.com', 'test-c.com', 'net77.cc', 'test-e.com'] } } });

  // TEST A — SIMPLE LOW RISK
  console.log('\nRunning TEST A: Simple Low Risk (HTTPS, Name, Email)...');
  const payloadA = {
    userId,
    domain: 'test-a.com',
    siteName: 'Test A',
    eventType: 'WEBSITE_VISIT',
    timestamp: new Date().toISOString(),
    riskScore: 8,
    riskLevel: 'Low',
    riskReasons: ['Personal name collection', 'Email address collection']
  };
  await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadA)
  });
  let recordA = await prisma.websiteRecord.findUnique({ where: { userId_domain: { userId, domain: 'test-a.com' } } });
  console.log(`[TEST A] Score: ${recordA.riskScore} (Expected: 8)`);
  console.log(`[TEST A] Level: ${recordA.riskLevel} (Expected: Low)`);

  // TEST B — MEDIUM PRIVACY EXPOSURE
  console.log('\nRunning TEST B: Medium Privacy Exposure (HTTPS, Name, Email, Phone, Marketing, Several trackers)...');
  const payloadB = {
    userId,
    domain: 'test-b.com',
    siteName: 'Test B',
    eventType: 'WEBSITE_VISIT',
    timestamp: new Date().toISOString(),
    riskScore: 39,
    riskLevel: 'Medium',
    riskReasons: ['Personal name collection', 'Email address collection', 'Telephone number collection', 'Pre-checked marketing consent checkbox', 'Multiple third-party tracking (3+ signals)']
  };
  await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadB)
  });
  let recordB = await prisma.websiteRecord.findUnique({ where: { userId_domain: { userId, domain: 'test-b.com' } } });
  console.log(`[TEST B] Score: ${recordB.riskScore} (Expected: 39)`);
  console.log(`[TEST B] Level: ${recordB.riskLevel} (Expected: Medium)`);

  // TEST C — HIGH SECURITY SIGNAL
  console.log('\nRunning TEST C: High Security Signal (HTTP, Password, Phone, DOB, No privacy policy)...');
  const payloadC = {
    userId,
    domain: 'test-c.com',
    siteName: 'Test C',
    eventType: 'WEBSITE_VISIT',
    timestamp: new Date().toISOString(),
    riskScore: 100, // Capped
    riskLevel: 'High',
    riskReasons: ['Insecure HTTP protocol', 'Sensitive credentials transmitted over insecure HTTP', 'Telephone number collection', 'Age/Date of Birth collection', 'Data collection without obvious privacy policy']
  };
  await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadC)
  });
  let recordC = await prisma.websiteRecord.findUnique({ where: { userId_domain: { userId, domain: 'test-c.com' } } });
  console.log(`[TEST C] Score: ${recordC.riskScore} (Expected: 100)`);
  console.log(`[TEST C] Level: ${recordC.riskLevel} (Expected: High)`);

  // TEST D — UNOFFICIAL STREAMING (net77.cc)
  console.log('\nRunning TEST D: Unofficial Streaming Category (net77.cc)...');
  const payloadD = {
    userId,
    domain: 'net77.cc',
    siteName: 'net77.cc',
    eventType: 'WEBSITE_VISIT',
    timestamp: new Date().toISOString(),
    riskScore: 68,
    riskLevel: 'High',
    riskReasons: ['Unofficial streaming category with elevated advertising and tracking exposure.', 'Extensive third-party tracking (6+ signals)', 'Unexpected external redirect detected', 'Aggressive popup/pop-under behavior', 'Notification permissions requested']
  };
  await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadD)
  });
  let recordD = await prisma.websiteRecord.findUnique({ where: { userId_domain: { userId, domain: 'net77.cc' } } });
  console.log(`[TEST D] Score: ${recordD.riskScore} (Expected: 68)`);
  console.log(`[TEST D] Level: ${recordD.riskLevel} (Expected: High)`);
  console.log(`[TEST D] Reasons: ${recordD.riskReasons}`);

  // TEST E — NORMAL MAJOR WEBSITE
  console.log('\nRunning TEST E: Normal Major Website (HTTPS, privacy policy, limited trackers)...');
  const payloadE = {
    userId,
    domain: 'test-e.com',
    siteName: 'Test E',
    eventType: 'WEBSITE_VISIT',
    timestamp: new Date().toISOString(),
    riskScore: 13,
    riskLevel: 'Low',
    riskReasons: ['Personal name collection', 'Email address collection', 'Third-party tracking script detected']
  };
  await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadE)
  });
  let recordE = await prisma.websiteRecord.findUnique({ where: { userId_domain: { userId, domain: 'test-e.com' } } });
  console.log(`[TEST E] Score: ${recordE.riskScore} (Expected: 13)`);
  console.log(`[TEST E] Level: ${recordE.riskLevel} (Expected: Low)`);

  console.log('\n--- VERIFICATION TEST MATRIX COMPLETED ---');
  await prisma.$disconnect();
}

runTestMatrix().catch(err => {
  console.error('Error in test matrix:', err);
  prisma.$disconnect();
});
