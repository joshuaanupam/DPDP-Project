const express = require('express');
const cors = require('cors');
require('dotenv').config();

const eventController = require('./controllers/eventController');
const dashboardController = require('./controllers/dashboardController');
const requestController = require('./controllers/requestController');
const auditController = require('./controllers/auditController');
const websiteController = require('./controllers/websiteController');
const aiController = require('./controllers/aiController');

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

// Central Dashboard Data
app.get('/api/dashboard/:userId', dashboardController.getDashboardData);

// 3-Tier Privacy Requests
app.post('/api/requests/create', requestController.createPrivacyRequest);
app.get('/api/requests/:userId', requestController.getUserRequests);
app.post('/api/requests/:requestId/status', requestController.updateRequestStatus);

// Audit Trail Logs
app.get('/api/audit/:userId', auditController.getAuditLogs);

// Website Details
app.get('/api/websites/:websiteId', websiteController.getWebsiteDetail);

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
    // Allow 'password' or match database hashed value for demo flexibility
    if (password === 'password' || user.passwordHash === 'hashed_demo_password' || user.passwordHash.includes('seed')) {
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
