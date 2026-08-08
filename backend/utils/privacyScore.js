/**
 * Calculates and updates user's Digital Privacy Score (0 - 100)
 * Formula: 100 - (ActiveMarketingConsents * 5) - (HighRiskWebsites * 10) + (RevokedConsents * 3)
 */
async function calculateAndSavePrivacyScore(prisma, userId) {
  try {
    const userConsents = await prisma.consent.findMany({
      where: { userId },
      include: { website: true }
    });

    const activeMarketingCount = userConsents.filter(
      c => c.status === 'ACTIVE' && (
        c.consentType.toLowerCase().includes('marketing') ||
        c.consentType.toLowerCase().includes('promotional') ||
        c.consentType.toLowerCase().includes('3rd-party') ||
        c.consentType.toLowerCase().includes('ads')
      )
    ).length;

    const revokedConsentsCount = userConsents.filter(c => c.status === 'REVOKED').length;

    // Get unique websites associated with the user
    const userWebsites = await prisma.website.findMany({
      where: {
        OR: [
          { consents: { some: { userId } } },
          { dataItems: { some: { userId } } }
        ]
      }
    });

    const highRiskSitesCount = userWebsites.filter(
      w => w.riskLevel && w.riskLevel.toUpperCase() === 'HIGH'
    ).length;

    let score = 100 - (activeMarketingCount * 5) - (highRiskSitesCount * 10) + (revokedConsentsCount * 3);
    
    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    await prisma.user.update({
      where: { id: userId },
      data: { privacyScore: score }
    });

    return score;
  } catch (error) {
    console.error('Error calculating privacy score:', error);
    return 85;
  }
}

module.exports = { calculateAndSavePrivacyScore };
