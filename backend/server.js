// Advanced DPDP Nominee Features
app.post('/api/user/nominate', userController.nominateUser);
app.post('/api/user/confirm-nomination', userController.confirmNomination);

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
