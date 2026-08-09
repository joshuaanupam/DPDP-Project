const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// Helper to load rules config
function getRules() {
  try {
    const configPath = path.join(__dirname, '../config/dpdpRules.json');
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading dpdpRules config, using defaults:', err);
    return {
      baseFailureToPreventBreach: 50000000,
      perPrincipalIncrementalFine: 100,
      maxFailureToPreventBreach: 2500000000,
      failureToReportBoard: 1500000000,
      failureToNotifyPrincipals: 1000000000
    };
  }
}

async function reportBreach(req, res) {
  try {
    const { orgId, description, affectedCount, reportedToBoard, principalsNotified } = req.body;
    if (!orgId || !description || affectedCount === undefined || reportedToBoard === undefined || principalsNotified === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: orgId, description, affectedCount, reportedToBoard, principalsNotified' });
    }

    const newBreach = await prisma.breach.create({
      data: {
        orgId,
        description,
        affectedCount: parseInt(affectedCount, 10),
        reportedToBoard: !!reportedToBoard,
        principalsNotified: !!principalsNotified
      }
    });

    res.status(201).json({
      success: true,
      message: 'Data breach logged successfully.',
      breach: newBreach
    });
  } catch (err) {
    console.error('Error logging breach:', err);
    res.status(500).json({ success: false, error: 'Failed to report breach', details: err.message });
  }
}

async function getPenaltyShield(req, res) {
  try {
    const breaches = await prisma.breach.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const rules = getRules();
    let totalExposure = 0;
    let totalAffectedCount = 0;
    let unreportedToBoardCount = 0;
    let unnotifiedPrincipalsCount = 0;

    const detailedBreaches = breaches.map(b => {
      totalAffectedCount += b.affectedCount;
      if (!b.reportedToBoard) unreportedToBoardCount++;
      if (!b.principalsNotified) unnotifiedPrincipalsCount++;

      // 1. Failure to prevent breach fine calculation
      let preventBreachFine = rules.baseFailureToPreventBreach + (b.affectedCount * rules.perPrincipalIncrementalFine);
      if (preventBreachFine > rules.maxFailureToPreventBreach) {
        preventBreachFine = rules.maxFailureToPreventBreach;
      }

      // 2. Failure to notify Board fine
      const boardFine = b.reportedToBoard ? 0 : rules.failureToReportBoard;

      // 3. Failure to notify users/principals fine
      const principalFine = b.principalsNotified ? 0 : rules.failureToNotifyPrincipals;

      const breachTotalFine = preventBreachFine + boardFine + principalFine;
      totalExposure += breachTotalFine;

      return {
        ...b,
        breakdown: {
          failureToPreventBreach: preventBreachFine,
          failureToReportBoard: boardFine,
          failureToNotifyPrincipals: principalFine,
          total: breachTotalFine
        }
      };
    });

    // Compute Shield Score
    // Formula: 100 - (breachCount * 15) - (unreportedToBoard * 25) - (unnotifiedPrincipals * 20)
    let shieldScore = 100 - (breaches.length * 15) - (unreportedToBoardCount * 25) - (unnotifiedPrincipalsCount * 20);
    shieldScore = Math.max(0, Math.min(100, shieldScore));

    let shieldBand = 'Excellent';
    let shieldColor = '#10b981'; // Green

    if (shieldScore < 50) {
      shieldBand = 'High Risk';
      shieldColor = '#ef4444'; // Red
    } else if (shieldScore < 85) {
      shieldBand = 'Fair';
      shieldColor = '#f59e0b'; // Amber
    }

    res.json({
      success: true,
      summary: {
        totalBreaches: breaches.length,
        totalAffectedIndividuals: totalAffectedCount,
        totalPenaltyExposureINR: totalExposure,
        shieldScore,
        shieldBand,
        shieldColor
      },
      rules,
      breaches: detailedBreaches
    });
  } catch (err) {
    console.error('Error calculating penalty shield:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate penalty shield', details: err.message });
  }
}

module.exports = {
  reportBreach,
  getPenaltyShield
};
