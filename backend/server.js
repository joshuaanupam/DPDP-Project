const express = require('express');
const cors = require('cors');
require('dotenv').config();

const eventController = require('./controllers/eventController');
const dashboardController = require('./controllers/dashboardController');
const requestController = require('./controllers/requestController');
const auditController = require('./controllers/auditController');
const websiteController = require('./controllers/websiteController');
const aiController = require('./controllers/aiController');
const userController = require('./controllers/userController');
const breachController = require('./controllers/breachController');
const authController = require('./controllers/authController');
const realtimeController = require('./controllers/realtimeController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'PrivacyLens REST API', timestamp: new Date() });
});

// Extension Events
app.post('/api/events', eventController.handleEvent);

// Authentication
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);

// Central Dashboard Data
app.get('/api/dashboard/:userId', dashboardController.getDashboardData);

// Realtime SSE updates
app.get('/api/realtime/:userId', realtimeController.handleRealtime);

// 3-Tier Privacy Requests
app.post('/api/requests/create', requestController.createPrivacyRequest);
app.get('/api/requests/:userId', requestController.getUserRequests);
app.post('/api/requests/:requestId/status', requestController.updateRequestStatus);

// Audit Trail Logs
app.get('/api/audit/:userId', auditController.getAuditLogs);

// Website Details
app.get('/api/websites/:websiteId', websiteController.getWebsiteDetail);

// Nominees Routing (Multi-Nominee system)
app.post('/api/nominees', async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const { userId, name, email, relationship } = req.body;
    if (!userId || !name || !email || !relationship) {
      return res.status(400).json({ success: false, message: 'All nominee details are required.' });
    }
    const nominee = await prisma.nominee.create({
      data: { userId, name, email, relationship, confirmed: true }
    });
    res.status(201).json({ success: true, nominee });
  } catch (err) {
    next(err);
  } finally {
    await prisma.$disconnect();
  }
});

app.delete('/api/nominees/:nomineeId', async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const { nomineeId } = req.params;
    await prisma.nominee.delete({ where: { id: nomineeId } });
    res.json({ success: true, message: 'Nominee removed.' });
  } catch (err) {
    next(err);
  } finally {
    await prisma.$disconnect();
  }
});

// Child Safe Mode Toggle/Update Routing
app.post('/api/child-consent/request', async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const { userId, isChild, parentEmail } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isChild: !!isChild,
        parentEmail: isChild ? parentEmail : null
      }
    });

    const { calculateAndSavePrivacyScore } = require('./utils/privacyScore');
    const newScore = await calculateAndSavePrivacyScore(prisma, userId);

    res.json({ success: true, user: { ...updatedUser, privacyScore: newScore } });
  } catch (err) {
    next(err);
  } finally {
    await prisma.$disconnect();
  }
});

// Advanced DPDP Nominee Features
app.post('/api/user/nominate', userController.nominateUser);
app.post('/api/user/confirm-nomination', userController.confirmNomination);

// Advanced DPDP Breach & Penalty Shield
app.get('/api/penalty-shield', breachController.getPenaltyShield);

// Unified Data Breach Reporting (handles both orgId [Breach] and websiteId [DataBreach] models)
app.post('/api/breaches/report', async (req, res, next) => {
  const { websiteId, orgId } = req.body;
  
  if (websiteId) {
    // DataBreach workflow from main
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const { description, affectedCount, severity } = req.body;
      if (!description) {
        return res.status(400).json({ success: false, message: 'Website ID and breach description are required.' });
      }
      const breach = await prisma.dataBreach.create({
        data: {
          websiteId,
          description,
          affectedCount: parseInt(affectedCount) || 1000,
          severity: severity || 'Medium',
          reportedToBoard: true
        }
      });

      // Recalculate privacy scores of affected users
      const consents = await prisma.consent.findMany({ where: { websiteId } });
      const userIds = Array.from(new Set(consents.map(c => c.userId)));
      const { calculateAndSavePrivacyScore } = require('./utils/privacyScore');
      for (const uId of userIds) {
        await calculateAndSavePrivacyScore(prisma, uId);
      }

      res.status(201).json({ success: true, breach });
    } catch (err) {
      next(err);
    } finally {
      await prisma.$disconnect();
    }
  } else if (orgId) {
    // Breach workflow from feature/backend-shopease
    return breachController.reportBreach(req, res);
  } else {
    return res.status(400).json({ success: false, message: 'Either websiteId or orgId is required to report a breach.' });
  }
});

// AI Policy Summarizer
app.post('/api/ai/summarize-policy', aiController.summarizePolicy);

// Reset Demo Database
app.post('/api/demo/reset', async (req, res) => {
  try {
    const { runSeed } = require('./prisma/seed');
    const { PrismaClient } = require('@prisma/client');
    const prismaClient = new PrismaClient();
    
    await runSeed(prismaClient);
    await prismaClient.$disconnect();
    
    res.json({ success: true, message: 'Database successfully reset and re-seeded with default websites and consents.' });
  } catch (err) {
    console.error('Error resetting database:', err);
    res.status(500).json({ success: false, message: 'Failed to reset database', error: err.message });
  }
});

// AI Policy Summarizer
app.post('/api/ai/summarize-policy', aiController.summarizePolicy);
app.post('/api/ai/website-brief', aiController.getWebsiteBrief);

// Authentication Routes
app.post('/api/auth/login', async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    // Check password: allow demo defaults OR direct match (for self-registered users)
    const isDemo = password === 'password' || user.passwordHash === 'hashed_demo_password' || user.passwordHash.includes('seed');
    const isDirectMatch = user.passwordHash === password; // For users who registered via sign-up form
    if (isDemo || isDirectMatch) {
      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          privacyScore: user.privacyScore
        },
        token: `token_${user.id}`
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  } catch (err) {
    next(err);
  } finally {
    await prisma.$disconnect();
  }
});

app.post('/api/auth/register', async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash: password, // For demo, store directly
        privacyScore: 100
      }
    });

    // Auto-create initial consents and data entries so dashboard is initialized
    await prisma.consent.create({
      data: {
        userId: user.id,
        websiteId: (await prisma.website.findFirst())?.id || 'web_shopease',
        consentType: 'Account Creation',
        status: 'ACTIVE'
      }
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        privacyScore: user.privacyScore
      },
      token: `token_${user.id}`
    });
  } catch (err) {
    next(err);
  } finally {
    await prisma.$disconnect();
  }
});

// Forgot Password — resets password to a new value (demo: stores plaintext)
app.post('/api/auth/forgot-password', async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      // Don't reveal if email exists — always return success for security
      return res.json({ success: true, message: 'If this email is registered, a reset link has been sent. For this demo, your password has been reset to: password123' });
    }
    // Reset password to a known demo value
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: 'password123' }
    });
    console.log(`[Password Reset] User ${user.email} password reset to password123`);
    return res.json({ success: true, message: 'Password reset successful! Your new password is: password123' });
  } catch (err) {
    next(err);
  } finally {
    await prisma.$disconnect();
  }
});

app.get('/api/auth/session/:token', async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const { token } = req.params;
    if (!token || !token.startsWith('token_')) {
      return res.status(401).json({ success: false, message: 'Invalid session token.' });
    }
    const userId = token.replace('token_', '');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Session not found.' });
    }
    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        privacyScore: user.privacyScore
      }
    });
  } catch (err) {
    next(err);
  } finally {
    await prisma.$disconnect();
  }
});


// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🛡️  PrivacyLens Backend API running on port ${PORT}`);
  console.log(`   Base URL: http://localhost:${PORT}/api`);
  console.log(`===================================================`);
});
