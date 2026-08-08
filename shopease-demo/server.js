const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory state store for ShopEase mock partner database
const userAccounts = new Map([
  ['joshua@example.com', {
    name: 'Joshua',
    email: 'joshua@example.com',
    phone: '+91 98765 43210',
    consents: {
      accountCreation: true,
      marketingEmails: true,
      thirdPartySharing: true
    },
    status: 'ACTIVE'
  }]
]);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Request logger
app.use((req, res, next) => {
  console.log(`[ShopEase ${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Partner Direct Revocation API (Tier 1 Integration)
app.post('/api/partner/revoke', (req, res) => {
  const { userId, userEmail, targetConsent } = req.body;
  const email = userEmail || 'joshua@example.com';

  console.log(`⚡ [ShopEase Partner API] Received direct consent revocation for: ${email}, Target: ${targetConsent || 'All Marketing'}`);

  const account = userAccounts.get(email) || {
    name: 'Demo User',
    email,
    phone: '+91 98765 43210',
    consents: { accountCreation: true, marketingEmails: true, thirdPartySharing: true },
    status: 'ACTIVE'
  };

  if (targetConsent && targetConsent.toLowerCase().includes('marketing')) {
    account.consents.marketingEmails = false;
  } else if (targetConsent && targetConsent.toLowerCase().includes('3rd-party')) {
    account.consents.thirdPartySharing = false;
  } else {
    account.consents.marketingEmails = false;
    account.consents.thirdPartySharing = false;
  }

  userAccounts.set(email, account);

  return res.json({
    success: true,
    message: `Direct API execution successful: ${targetConsent || 'Marketing consent'} revoked on ShopEase servers.`,
    partnerReferenceId: `SE_REV_${Date.now()}`,
    updatedConsents: account.consents,
    timestamp: new Date().toISOString()
  });
});

// Partner Account Deletion API (Tier 1 Deletion Integration)
app.post('/api/partner/delete', (req, res) => {
  const { userId, userEmail } = req.body;
  const email = userEmail || 'joshua@example.com';

  console.log(`🗑️ [ShopEase Partner API] Received account deletion request for: ${email}`);

  if (userAccounts.has(email)) {
    userAccounts.delete(email);
  }

  return res.json({
    success: true,
    message: `Account deletion request accepted on ShopEase servers for ${email} under DPDP Section 12.`,
    partnerReferenceId: `SE_DEL_${Date.now()}`,
    timestamp: new Date().toISOString()
  });
});

// Partner Account Query Endpoint
app.get('/api/partner/status/:email', (req, res) => {
  const email = req.params.email;
  const account = userAccounts.get(email);
  if (!account) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }
  return res.json({ success: true, account });
});

// Fallback to index.html for SPA routing if needed
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🛍️  ShopEase Demo E-Commerce Site running on port ${PORT}`);
  console.log(`   Website URL: http://localhost:${PORT}`);
  console.log(`   Partner API: http://localhost:${PORT}/api/partner/revoke`);
  console.log(`===================================================`);
});
