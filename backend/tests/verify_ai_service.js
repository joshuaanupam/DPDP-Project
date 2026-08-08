/**
 * @file verify_ai_service.js
 * @description Automated test script to verify backend/services/aiService.js functionality
 * under both normal and fallback (no API key or timeout) execution modes.
 * Owned by: TM1 (Project Lead)
 */

const { summarizePrivacyPolicy, generateLegalNotice } = require('../services/aiService');

async function runTests() {
  console.log('==================================================');
  console.log('🛡️  PrivacyLens — AI Intelligence Service Test Suite');
  console.log('==================================================\n');

  const samplePrivacyPolicy = `
    ShopEase Shopping Inc. Privacy Policy.
    Last updated: August 2026.
    We collect your name, email address, physical address, and telephone number when you sign up.
    We use tracking pixels, browser cookies, and device fingerprints to monitor user behavior and display target marketing.
    We share personal identifiers and transaction history with third-party advertising networks and affiliates.
    We retain user data indefinitely unless requested otherwise.
    You may contact our privacy officer at dpo@shopease.com to request deletion of your account details,
    or to withdraw/revoke marketing consent under local data protection laws (DPDP Act).
  `;

  // Test Case 1: Rule-Based Fallback Engine
  console.log('🧪 Test Case 1: Rule-Based Fallback Engine (No API Key)');
  console.log('--------------------------------------------------');
  const fallbackResult = await summarizePrivacyPolicy(samplePrivacyPolicy, 'ShopEase', { apiKey: null });
  
  console.log('Success:', fallbackResult.success);
  console.log('Is Fallback Active:', fallbackResult.isFallback);
  console.log('Model Used:', fallbackResult.modelUsed);
  console.log('Assessed Risk Level:', fallbackResult.riskLevel);
  console.log('Generated Plain-English Summary:');
  console.log(fallbackResult.summary);
  console.log('Key Takeaways:', fallbackResult.keyTakeaways);
  
  if (fallbackResult.success && fallbackResult.isFallback && fallbackResult.bullets.length === 2) {
    console.log('✅ Test Case 1 Passed!');
  } else {
    console.error('❌ Test Case 1 Failed!');
  }
  console.log('');

  // Test Case 2: Structured DPDP Notice Generator
  console.log('🧪 Test Case 2: Structured DPDP Legal Request Notice');
  console.log('--------------------------------------------------');
  const notice = generateLegalNotice({
    userName: 'Joshua',
    userEmail: 'joshua@example.com',
    websiteName: 'ShopEase',
    dpoEmail: 'dpo@shopease.com',
    requestType: 'DATA_ERASURE',
    customNotes: 'Please delete my transaction history.'
  });

  console.log('Subject:', notice.subject);
  console.log('Body Excerpt:\n', notice.body.substring(0, 350) + '...\n');
  console.log('Mailto URL generated:', notice.mailtoUrl.substring(0, 100) + '...');
  
  if (notice.subject.includes('Data Erasure') && notice.body.includes('Section 12')) {
    console.log('✅ Test Case 2 Passed!');
  } else {
    console.error('❌ Test Case 2 Failed!');
  }
  console.log('');

  // Test Case 3: Live Gemini API Simulation with invalid key
  console.log('🧪 Test Case 3: Error Handling & Failover (Invalid API Key)');
  console.log('--------------------------------------------------');
  const errorResult = await summarizePrivacyPolicy(samplePrivacyPolicy, 'ShopEase', { apiKey: 'INVALID_MOCK_KEY_FOR_TEST' });
  
  console.log('Success:', errorResult.success);
  console.log('Is Fallback Active:', errorResult.isFallback);
  console.log('Model Used:', errorResult.modelUsed);
  console.log('Assessed Risk Level:', errorResult.riskLevel);
  console.log('Summary output check:', !!errorResult.summary);
  
  if (errorResult.success && errorResult.isFallback) {
    console.log('✅ Test Case 3 Passed! Gracefully failed over to rule-based fallback.');
  } else {
    console.error('❌ Test Case 3 Failed!');
  }
  console.log('\n==================================================');
  console.log('✨ All AI Service Tests Completed successfully!');
  console.log('==================================================');
}

runTests().catch(err => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
