const express = require('express');
const cors = require('cors');
require('dotenv').config();

const eventController = require('./controllers/eventController');
const dashboardController = require('./controllers/dashboardController');
const requestController = require('./controllers/requestController');
const auditController = require('./controllers/auditController');
const websiteController = require('./controllers/websiteController');

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
app.post('/api/demo/reset', async (req, res, next) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    await prisma.auditLog.deleteMany();
    await prisma.privacyRequest.deleteMany();
    await prisma.consent.deleteMany();
    await prisma.dataItem.deleteMany();
    await prisma.website.deleteMany();
    await prisma.user.deleteMany();

    await prisma.user.create({
      data: {
        id: 'usr_12345',
        name: 'Joshua',
        email: 'joshua@example.com',
        passwordHash: 'hashed_demo_password',
        privacyScore: 100
      }
    });

    console.log('🧹 Live Demo Reset executed from Dashboard.');
    res.json({ success: true, message: 'Database reset successfully.' });
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
