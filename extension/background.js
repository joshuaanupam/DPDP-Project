// background.js - RECLAIM Privacy Exposure Service Worker (Stage 2)
// Implements: Bounded Exposure Model, Explainable Risk Engine, Cleanup Registry, and Hackathon Demo Mode

const BACKEND_API = 'http://localhost:5000/api/events';
const MAX_EXPOSURE_RECORDS = 200;
const MAX_RECENT_EVENTS = 20;

// Configurable Cleanup Method Registry for popular domains
const CLEANUP_REGISTRY = {
  'google.com': { method: 'official_page', url: 'https://myaccount.google.com/privacyselect', type: 'account_deletion' },
  'facebook.com': { method: 'official_page', url: 'https://www.facebook.com/help/delete_account', type: 'account_deletion' },
  'amazon.com': { method: 'official_page', url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=G8SWB23BStandard', type: 'account_deletion' },
  'x.com': { method: 'official_page', url: 'https://x.com/settings/deactivate', type: 'account_deletion' },
  'twitter.com': { method: 'official_page', url: 'https://twitter.com/settings/deactivate', type: 'account_deletion' },
  'linkedin.com': { method: 'official_page', url: 'https://www.linkedin.com/psettings/account-management/close-account', type: 'account_deletion' },
  'netflix.com': { method: 'official_page', url: 'https://www.netflix.com/youraccount', type: 'account_deletion' },
  'oldshopping.com': { method: 'official_page', url: 'https://example.com/delete-account', type: 'account_deletion' }
};

// Hackathon Demo Dataset (Pre-populated sample data)
const DEMO_EXPOSURES = {
  'oldshopping.com': {
    id: 'exp_demo_1',
    domain: 'oldshopping.com',
    firstSeen: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 12 months ago
    lastSeen: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
    dataTypes: ['email', 'phone', 'name'],
    consentTypes: ['marketing', 'promotional'],
    eventCount: 4,
    accountExposure: 'possible',
    riskLevel: 'high',
    riskReasons: [
      'Multiple sensitive categories (Email, Phone, Name)',
      'Marketing & Promotional consent granted',
      'Inactive account (No activity for >300 days)'
    ],
    cleanupStatus: 'RECOMMENDED',
    isDemo: true
  },
  'couponcollector.io': {
    id: 'exp_demo_2',
    domain: 'couponcollector.io',
    firstSeen: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    lastSeen: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    dataTypes: ['email', 'phone'],
    consentTypes: ['marketing'],
    eventCount: 2,
    accountExposure: 'possible',
    riskLevel: 'high',
    riskReasons: [
      'Email & Phone number linked',
      'Active marketing consent',
      'Inactive for >100 days'
    ],
    cleanupStatus: 'RECOMMENDED',
    isDemo: true
  },
  'socialnewsdaily.com': {
    id: 'exp_demo_3',
    domain: 'socialnewsdaily.com',
    firstSeen: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastSeen: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    dataTypes: ['email'],
    consentTypes: ['promotional'],
    eventCount: 1,
    accountExposure: 'possible',
    riskLevel: 'medium',
    riskReasons: [
      'Email address captured',
      'Promotional newsletter consent',
      'Inactive for >30 days'
    ],
    cleanupStatus: 'NOT_REVIEWED',
    isDemo: true
  },
  'devtooling.org': {
    id: 'exp_demo_4',
    domain: 'devtooling.org',
    firstSeen: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastSeen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dataTypes: ['email'],
    consentTypes: ['terms'],
    eventCount: 5,
    accountExposure: 'possible',
    riskLevel: 'low',
    riskReasons: [
      'Only email captured',
      'Essential terms consent only',
      'Recent active usage'
    ],
    cleanupStatus: 'USER_KEPT',
    isDemo: true
  },
  'fastdeliveryapp.com': {
    id: 'exp_demo_5',
    domain: 'fastdeliveryapp.com',
    firstSeen: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    lastSeen: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    dataTypes: ['email', 'phone', 'name'],
    consentTypes: ['terms'],
    eventCount: 3,
    accountExposure: 'possible',
    riskLevel: 'medium',
    riskReasons: [
      'Email, Phone, and Name captured',
      'Inactive for >90 days'
    ],
    cleanupStatus: 'COMPLETED',
    isDemo: true
  }
};

/**
 * Explainable Risk Classification Engine
 * Evaluates factors and returns risk level and human-readable reasons.
 */
function evaluateRisk(dataTypes = [], consentTypes = [], lastSeenDate = null) {
  let score = 0;
  const reasons = [];

  const hasEmail = dataTypes.includes('email');
  const hasPhone = dataTypes.includes('phone');
  const hasName = dataTypes.includes('name');
  const hasMarketing = consentTypes.includes('marketing');
  const hasPromotional = consentTypes.includes('promotional');

  if (hasEmail) {
    score += 1;
    reasons.push('Email address captured');
  }
  if (hasPhone) {
    score += 2;
    reasons.push('Phone number captured (+2 severity)');
  }
  if (hasName) {
    score += 1;
    reasons.push('Full name linked');
  }
  if (hasMarketing) {
    score += 2;
    reasons.push('Marketing communications consent granted');
  }
  if (hasPromotional) {
    score += 2;
    reasons.push('Promotional newsletter consent active');
  }

  // Calculate inactivity
  if (lastSeenDate) {
    const daysInactive = (Date.now() - new Date(lastSeenDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysInactive > 90) {
      score += 2;
      reasons.push(`Inactive account (No activity for ${Math.floor(daysInactive)} days)`);
    } else if (daysInactive > 30) {
      score += 1;
      reasons.push(`Inactive account (No activity for ${Math.floor(daysInactive)} days)`);
    }
  }

  let riskLevel = 'low';
  if (score >= 6) {
    riskLevel = 'high';
  } else if (score >= 3) {
    riskLevel = 'medium';
  }

  return { riskLevel, riskReasons: reasons, riskScore: score };
}

/**
 * Helper to get cleanup method for a domain
 */
function getCleanupMethod(domain) {
  const normalized = (domain || '').toLowerCase();
  if (CLEANUP_REGISTRY[normalized]) {
    return CLEANUP_REGISTRY[normalized];
  }
  return {
    method: 'manual_action',
    url: null,
    type: 'manual_required'
  };
}

// Initial Extension Setup
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['exposures']);
  if (!data.exposures || Object.keys(data.exposures).length === 0) {
    // Pre-seed with Hackathon Demo data on fresh install
    await chrome.storage.local.set({
      exposures: DEMO_EXPOSURES,
      demoMode: true,
      timeline: [
        { domain: 'oldshopping.com', action: 'Form Submission - Email, Phone, Name', timestamp: new Date(Date.now() - 300 * 24 * 3600 * 1000).toISOString() },
        { domain: 'couponcollector.io', action: 'Marketing Consent Granted', timestamp: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString() },
        { domain: 'devtooling.org', action: 'Form Submission - Email', timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() }
      ]
    });
  }
});

/**
 * Listener for Extension Message Bus
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === 'FORM_SUBMISSION') {
    processExposureEvent(message);
    sendToBackend(message);
  } else if (message.type === 'UPDATE_CLEANUP_STATUS') {
    handleUpdateCleanupStatus(message.domain, message.status);
  } else if (message.type === 'TOGGLE_DEMO_MODE') {
    handleToggleDemoMode(message.enableDemo);
  } else if (message.type === 'GET_CLEANUP_INFO') {
    const info = getCleanupMethod(message.domain);
    sendResponse(info);
    return true;
  }
});

/**
 * Updates cleanup status for a specific domain record
 */
async function handleUpdateCleanupStatus(domain, status) {
  if (!domain || !status) return;

  try {
    const data = await chrome.storage.local.get(['exposures', 'timeline']);
    const exposures = data.exposures || {};
    const timeline = data.timeline || [];

    if (exposures[domain]) {
      exposures[domain].cleanupStatus = status;
      
      // Log timeline entry
      timeline.unshift({
        domain: domain,
        action: `Cleanup status updated to ${status.replace('_', ' ')}`,
        timestamp: new Date().toISOString()
      });

      await chrome.storage.local.set({ exposures, timeline });
      chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});
    }
  } catch (err) {
    console.error('Error updating cleanup status:', err);
  }
}

/**
 * Toggles Demo Mode data loading for hackathon presentation
 */
async function handleToggleDemoMode(enableDemo) {
  if (enableDemo) {
    await chrome.storage.local.set({
      exposures: DEMO_EXPOSURES,
      demoMode: true
    });
  } else {
    // Clear demo data, keeping only non-demo records if any
    const data = await chrome.storage.local.get(['exposures']);
    const exposures = data.exposures || {};
    const realExposures = {};

    Object.keys(exposures).forEach(k => {
      if (!exposures[k].isDemo) {
        realExposures[k] = exposures[k];
      }
    });

    await chrome.storage.local.set({
      exposures: realExposures,
      demoMode: false
    });
  }

  chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});
}

/**
 * Process incoming real form submission event
 */
async function processExposureEvent(event) {
  try {
    const storageData = await chrome.storage.local.get(['exposures', 'recentEvents', 'timeline']);
    let exposures = storageData.exposures || {};
    let recentEvents = storageData.recentEvents || [];
    let timeline = storageData.timeline || [];

    const domain = event.domain;
    const now = new Date().toISOString();
    const existing = exposures[domain];

    if (existing) {
      const mergedDataTypes = Array.from(new Set([...(existing.dataTypes || []), ...(event.dataTypes || [])]));
      const mergedConsentTypes = Array.from(new Set([...(existing.consentTypes || []), ...(event.consents || [])]));
      
      const { riskLevel, riskReasons } = evaluateRisk(mergedDataTypes, mergedConsentTypes, now);

      exposures[domain] = {
        ...existing,
        lastSeen: now,
        dataTypes: mergedDataTypes,
        consentTypes: mergedConsentTypes,
        eventCount: (existing.eventCount || 1) + 1,
        riskLevel: riskLevel,
        riskReasons: riskReasons
      };
    } else {
      const { riskLevel, riskReasons } = evaluateRisk(event.dataTypes, event.consents, now);

      exposures[domain] = {
        id: 'exp_' + Math.random().toString(36).substring(2, 11),
        domain: domain,
        firstSeen: now,
        lastSeen: now,
        dataTypes: event.dataTypes || [],
        consentTypes: event.consents || [],
        eventCount: 1,
        accountExposure: 'possible',
        riskLevel: riskLevel,
        riskReasons: riskReasons,
        cleanupStatus: 'RECOMMENDED'
      };
    }

    // Bounded Growth (Evict oldest if over limit)
    const domainKeys = Object.keys(exposures);
    if (domainKeys.length > MAX_EXPOSURE_RECORDS) {
      const sortedKeys = domainKeys.sort((a, b) => new Date(exposures[a].lastSeen) - new Date(exposures[b].lastSeen));
      delete exposures[sortedKeys[0]];
    }

    // Recent events log
    recentEvents.unshift({
      eventId: event.eventId,
      domain: domain,
      dataTypes: event.dataTypes,
      consents: event.consents,
      timestamp: now,
      eventType: event.eventType
    });
    if (recentEvents.length > MAX_RECENT_EVENTS) {
      recentEvents = recentEvents.slice(0, MAX_RECENT_EVENTS);
    }

    // Add to timeline
    timeline.unshift({
      domain: domain,
      action: `Form Submission Detected (${(event.dataTypes || []).join(', ')})`,
      timestamp: now
    });
    if (timeline.length > 50) timeline = timeline.slice(0, 50);

    await chrome.storage.local.set({ exposures, recentEvents, timeline });
    chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});

  } catch (err) {
    console.error('RECLAIM Service Worker Storage Error:', err);
  }
}

/**
 * Transmits metadata payload to backend if available
 */
async function sendToBackend(event) {
  const backendPayload = {
    domain: event.domain,
    dataTypes: event.dataTypes || [],
    consents: event.consents || [],
    eventType: event.eventType || 'FORM_SUBMISSION',
    timestamp: event.timestamp,
    eventId: event.eventId
  };

  try {
    await fetch(BACKEND_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload)
    });
  } catch (err) {
    // Offline resilience - backend is optional for local extension operation
  }
}
