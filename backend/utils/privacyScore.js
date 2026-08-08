/**
 * @file privacyScore.js
 * @description Digital Privacy Score Engine for PrivacyLens DPDP Platform
 * Formula: Score = 100 - (ActiveMarketingConsents * 5) - (HighRiskSites * 10) + (RevokedConsents * 3)
 * Bounds: Clamped strictly to [0, 100]
 * Owned by: TM1 (Project Lead & AI Intelligence Engineer)
 */

/**
 * Calculates the Digital Privacy Score from discrete counts.
 * 
 * @param {object} params
 * @param {number} [params.activeMarketingConsents=0] - Number of active marketing/tracking consents
 * @param {number} [params.highRiskSites=0] - Number of high-risk websites storing user data
 * @param {number} [params.revokedConsents=0] - Number of successfully revoked consents (rewards user)
 * @returns {number} Score integer between 0 and 100
 */
function calculatePrivacyScore({
  activeMarketingConsents = 0,
  highRiskSites = 0,
  revokedConsents = 0
} = {}) {
  const marketing = Math.max(0, parseInt(activeMarketingConsents, 10) || 0);
  const highRisk = Math.max(0, parseInt(highRiskSites, 10) || 0);
  const revoked = Math.max(0, parseInt(revokedConsents, 10) || 0);

  // Exact DPDP Master Document Formula
  const rawScore = 100 - (marketing * 5) - (highRisk * 10) + (revoked * 3);

  // Strictly clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/**
 * Evaluates the full privacy profile and score from user collections.
 * 
 * @param {object} data
 * @param {Array<object>} [data.websites=[]] - List of connected website records
 * @param {Array<object>} [data.consents=[]] - List of consent records
 * @param {Array<object>} [data.requests=[]] - List of privacy requests
 * @returns {{
 *   score: number,
 *   band: string,
 *   grade: string,
 *   color: string,
 *   badge: string,
 *   breakdown: {
 *     activeMarketingConsents: number,
 *     highRiskSites: number,
 *     revokedConsents: number,
 *     totalWebsites: number,
 *     activeConsents: number,
 *     pendingRequests: number
 *   }
 * }}
 */
function calculateUserPrivacyScoreFromData({
  websites = [],
  consents = [],
  requests = []
} = {}) {
  const marketingKeywords = ['marketing', 'ad', 'tracking', 'promot', 'newsletter', '3rd-party'];

  // Count active marketing consents
  let activeMarketingCount = 0;
  let activeTotalConsents = 0;
  let revokedConsentsCount = 0;

  for (const c of consents) {
    const isRevoked = c.status === 'REVOKED' || !!c.revokedAt;
    const typeLower = (c.consentType || '').toLowerCase();
    const isMarketing = marketingKeywords.some(kw => typeLower.includes(kw));

    if (isRevoked) {
      revokedConsentsCount++;
    } else if (c.status === 'ACTIVE' || c.granted === true) {
      activeTotalConsents++;
      if (isMarketing) {
        activeMarketingCount++;
      }
    }
  }

  // Count high-risk websites
  let highRiskSitesCount = 0;
  for (const w of websites) {
    const risk = (w.riskLevel || computeWebsiteRisk(w)).toLowerCase();
    if (risk === 'high') {
      highRiskSitesCount++;
    }
  }

  // Count pending privacy requests
  const pendingRequestsCount = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'AWAITING_RESPONSE').length;

  // Compute final score
  const score = calculatePrivacyScore({
    activeMarketingConsents: activeMarketingCount,
    highRiskSites: highRiskSitesCount,
    revokedConsents: revokedConsentsCount
  });

  const bandInfo = getScoreBand(score);

  return {
    score,
    ...bandInfo,
    breakdown: {
      activeMarketingConsents: activeMarketingCount,
      highRiskSites: highRiskSitesCount,
      revokedConsents: revokedConsentsCount,
      totalWebsites: websites.length,
      activeConsents: activeTotalConsents,
      pendingRequests: pendingRequestsCount
    }
  };
}

/**
 * Maps a numeric score (0–100) to human-readable privacy bands and visual tokens.
 * 
 * @param {number} score 
 * @returns {{ band: string, grade: string, color: string, badge: string, description: string }}
 */
function getScoreBand(score) {
  const clamped = Math.max(0, Math.min(100, Math.round(score || 0)));

  if (clamped >= 85) {
    return {
      band: 'Excellent',
      grade: 'A',
      color: '#10b981', // Emerald Green
      badge: 'Protected Footprint',
      description: 'Minimal marketing exposure with active privacy hygiene.'
    };
  }
  if (clamped >= 70) {
    return {
      band: 'Good',
      grade: 'B',
      color: '#3b82f6', // Bright Blue
      badge: 'Moderate Privacy',
      description: 'Reasonable exposure; a few marketing consents could be pruned.'
    };
  }
  if (clamped >= 50) {
    return {
      band: 'Fair',
      grade: 'C',
      color: '#f59e0b', // Amber / Warning
      badge: 'Action Needed',
      description: 'Multiple active consents or high-risk accounts detected.'
    };
  }
  return {
    band: 'High Risk',
    grade: 'D',
    color: '#ef4444', // Red / Critical
    badge: 'Critical Exposure',
    description: 'High concentration of sensitive data and unrevoked third-party consents.'
  };
}

/**
 * Helper to compute the risk tier for a single website based on data items and consents.
 * 
 * @param {object} website 
 * @returns {'Low' | 'Medium' | 'High'}
 */
function computeWebsiteRisk(website = {}) {
  if (website.riskLevel) return website.riskLevel;

  const dataItems = (website.dataItems || []).map(d => d.toLowerCase());
  const activeConsents = (website.activeConsents || []).map(c => typeof c === 'string' ? c.toLowerCase() : (c.consentType || '').toLowerCase());

  let riskPoints = 0;

  // Sensitive data check
  if (dataItems.some(d => d.includes('location') || d.includes('gps'))) riskPoints += 3;
  if (dataItems.some(d => d.includes('financial') || d.includes('card') || d.includes('payment'))) riskPoints += 3;
  if (dataItems.some(d => d.includes('phone') || d.includes('mobile'))) riskPoints += 1;
  if (dataItems.some(d => d.includes('email'))) riskPoints += 1;

  // Consent risk check
  if (activeConsents.some(c => c.includes('3rd-party') || c.includes('ads') || c.includes('track'))) riskPoints += 3;
  if (activeConsents.some(c => c.includes('marketing'))) riskPoints += 2;

  if (riskPoints >= 5) return 'High';
  if (riskPoints >= 3) return 'Medium';
  return 'Low';
}

module.exports = {
  calculatePrivacyScore,
  calculateUserPrivacyScoreFromData,
  getScoreBand,
  computeWebsiteRisk
};
