// background.js - RECLAIM Privacy Exposure Service Worker
// Manages: Full Exposure Database, Real Website Visit Activity (Rolling 5 Unique Domains Queue), Risk Engine, and Demo Isolation

const BACKEND_API = 'http://localhost:5000/api/events';
const MAX_EXPOSURE_RECORDS = 200; // Database limit for unique domain exposure records
const MAX_RECENT_VISITS = 5;      // Strict 5-item limit for Recent Website Activity

/**
 * Normalizes host domain for display and storage consistency (e.g. www.amazon.in -> amazon.in)
 */
function normalizeDomain(hostname) {
  if (!hostname) return '';
  let domain = hostname.toLowerCase().trim().split(':')[0];
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }
  return domain;
}

/**
 * Filters out internal browser/extension URLs (chrome://, edge://, file://, chrome-extension://, etc.)
 */
function isInternalUrl(urlOrDomain) {
  if (!urlOrDomain) return true;
  const lower = urlOrDomain.toLowerCase().trim();
  const internalPrefixes = [
    'chrome://', 'chrome-extension://', 'edge://', 'about:',
    'devtools://', 'file://', 'blob:', 'data:', 'view-source:'
  ];
  return internalPrefixes.some(prefix => lower.startsWith(prefix)) || lower === 'unknown' || lower === 'newtab';
}

// Configurable Cleanup Method Registry for popular domains
const CLEANUP_REGISTRY = {
  'google.com': { method: 'official_page', url: 'https://myaccount.google.com/privacyselect', type: 'account_deletion' },
  'facebook.com': { method: 'official_page', url: 'https://www.facebook.com/help/delete_account', type: 'account_deletion' },
  'amazon.com': { method: 'official_page', url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=G8SWB23BStandard', type: 'account_deletion' },
  'amazon.in': { method: 'official_page', url: 'https://www.amazon.in/gp/help/customer/display.html?nodeId=G8SWB23BStandard', type: 'account_deletion' },
  'x.com': { method: 'official_page', url: 'https://x.com/settings/deactivate', type: 'account_deletion' },
  'twitter.com': { method: 'official_page', url: 'https://twitter.com/settings/deactivate', type: 'account_deletion' },
  'linkedin.com': { method: 'official_page', url: 'https://www.linkedin.com/psettings/account-management/close-account', type: 'account_deletion' },
  'netflix.com': { method: 'official_page', url: 'https://www.netflix.com/youraccount', type: 'account_deletion' },
  'oldshopping.com': { method: 'official_page', url: 'https://example.com/delete-account', type: 'account_deletion' }
};

// Hackathon Demo Dataset (Used ONLY when Demo Mode is explicitly enabled by user)
const DEMO_EXPOSURES = {
  'oldshopping.com': {
    id: 'exp_demo_1',
    domain: 'oldshopping.com',
    firstSeen: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
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

// Demo Recent Visits Queue (Used ONLY when Demo Mode is explicitly enabled by user)
const DEMO_RECENT_VISITS = [
  { domain: 'myntra.com', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isDemo: true },
  { domain: 'croma.com', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), isDemo: true },
  { domain: 'instagram.com', timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), isDemo: true },
  { domain: 'flipkart.com', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), isDemo: true },
  { domain: 'amazon.in', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), isDemo: true }
];

/**
 * Deterministic Explainable Risk Classification Engine
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
  const normalized = normalizeDomain(domain);
  if (CLEANUP_REGISTRY[normalized]) {
    return CLEANUP_REGISTRY[normalized];
  }
  return {
    method: 'manual_action',
    url: null,
    type: 'manual_required'
  };
}

// Initial Extension Setup (Starts Completely CLEAN in Real User Mode)
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['reclaimEnabled']);
  if (data.reclaimEnabled === undefined) {
    await chrome.storage.local.set({
      reclaimEnabled: true,
      demoMode: false,
      exposures: {},            // Clean exposures DB for real user
      recentWebsiteVisits: [],  // Clean recent visits queue for real user
      timeline: []
    });
  }
});

/**
 * Message Bus Listener
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  if (message.type === 'PAGE_VISIT') {
    processWebsiteVisit(message);
  } else if (message.type === 'FORM_SUBMISSION') {
    processExposureEvent(message);
    sendToBackend(message);
  } else if (message.type === 'UPDATE_CLEANUP_STATUS') {
    handleUpdateCleanupStatus(message.domain, message.status);
  } else if (message.type === 'TOGGLE_DEMO_MODE') {
    handleToggleDemoMode(message.enableDemo);
  } else if (message.type === 'CLEAR_ALL_DATA') {
    handleClearAllData();
  } else if (message.type === 'GET_CLEANUP_INFO') {
    const info = getCleanupMethod(message.domain);
    sendResponse(info);
    return true;
  }
});

/**
 * Processes Real Website Navigation Visit
 * Maintains rolling 5 most recently visited UNIQUE domains.
 */
async function processWebsiteVisit(data) {
  const domain = normalizeDomain(data.domain);
  if (!domain || isInternalUrl(domain) || isInternalUrl(data.url)) {
    return; // Ignore internal browser pages (chrome://, edge://, extension pages, file://)
  }

  const storage = await chrome.storage.local.get(['recentWebsiteVisits', 'reclaimEnabled', 'demoMode']);
  
  // Stop recording if RECLAIM is disabled by user
  if (storage.reclaimEnabled === false) return;

  const isDemo = storage.demoMode || false;
  let visits = storage.recentWebsiteVisits || [];

  const now = data.timestamp || new Date().toISOString();

  // Deduplication logic for Recent Website Activity:
  // If domain was previously visited, remove old entry so it moves to top with latest timestamp
  visits = visits.filter(v => normalizeDomain(v.domain) !== domain);

  // Insert newest visit at index 0 (TOP)
  visits.unshift({
    domain: domain,
    timestamp: now,
    isDemo: isDemo
  });

  // Limit to maximum 5 unique recent domains
  if (visits.length > MAX_RECENT_VISITS) {
    visits = visits.slice(0, MAX_RECENT_VISITS);
  }

  await chrome.storage.local.set({ recentWebsiteVisits: visits });
  chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});
}

/**
 * Updates cleanup status for a domain in main exposures DB
 */
async function handleUpdateCleanupStatus(domain, status) {
  if (!domain || !status) return;
  const normalized = normalizeDomain(domain);

  try {
    const data = await chrome.storage.local.get(['exposures', 'timeline']);
    const exposures = data.exposures || {};
    const timeline = data.timeline || [];

    if (exposures[normalized]) {
      exposures[normalized].cleanupStatus = status;
      
      timeline.unshift({
        domain: normalized,
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
 * Toggles Demo Mode data loading (Strictly isolated from real user mode)
 */
async function handleToggleDemoMode(enableDemo) {
  if (enableDemo) {
    await chrome.storage.local.set({
      exposures: DEMO_EXPOSURES,
      recentWebsiteVisits: DEMO_RECENT_VISITS,
      demoMode: true
    });
  } else {
    // Clear demo data cleanly, preserving real user records if any exist
    const data = await chrome.storage.local.get(['exposures', 'recentWebsiteVisits']);
    const exposures = data.exposures || {};
    const realExposures = {};

    Object.keys(exposures).forEach(k => {
      if (!exposures[k].isDemo) {
        realExposures[k] = exposures[k];
      }
    });

    const realVisits = (data.recentWebsiteVisits || []).filter(v => !v.isDemo);

    await chrome.storage.local.set({
      exposures: realExposures,
      recentWebsiteVisits: realVisits,
      demoMode: false
    });
  }

  chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});
}

/**
 * Clears all local exposure & activity data
 */
async function handleClearAllData() {
  await chrome.storage.local.set({
    exposures: {},
    recentWebsiteVisits: [],
    timeline: [],
    demoMode: false
  });
  chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});
}

/**
 * Process incoming form submission event.
 * Records EXPOSURE in main exposures DB (not website visit queue).
 */
async function processExposureEvent(event) {
  try {
    const storageData = await chrome.storage.local.get(['exposures', 'timeline', 'reclaimEnabled']);
    if (storageData.reclaimEnabled === false) return;

    let exposures = storageData.exposures || {};
    let timeline = storageData.timeline || [];

    const domain = normalizeDomain(event.domain);
    if (!domain || isInternalUrl(domain)) return;

    const now = new Date().toISOString();
    const existing = exposures[domain];

    const { riskLevel, riskReasons } = evaluateRisk(event.dataTypes || [], event.consents || [], now);

    if (existing) {
      const mergedDataTypes = Array.from(new Set([...(existing.dataTypes || []), ...(event.dataTypes || [])]));
      const mergedConsentTypes = Array.from(new Set([...(existing.consentTypes || []), ...(event.consents || [])]));
      
      const updatedRisk = evaluateRisk(mergedDataTypes, mergedConsentTypes, now);

      exposures[domain] = {
        ...existing,
        lastSeen: now,
        dataTypes: mergedDataTypes,
        consentTypes: mergedConsentTypes,
        eventCount: (existing.eventCount || 1) + 1,
        riskLevel: updatedRisk.riskLevel,
        riskReasons: updatedRisk.riskReasons
      };
    } else {
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

    // Database Bounded Limit (evict oldest domain if over 200)
    const domainKeys = Object.keys(exposures);
    if (domainKeys.length > MAX_EXPOSURE_RECORDS) {
      const sortedKeys = domainKeys.sort((a, b) => new Date(exposures[a].lastSeen) - new Date(exposures[b].lastSeen));
      delete exposures[sortedKeys[0]];
    }

    // Update timeline
    timeline.unshift({
      domain: domain,
      action: `Form Submission Detected (${(event.dataTypes || []).join(', ')})`,
      timestamp: now
    });
    if (timeline.length > 50) timeline = timeline.slice(0, 50);

    // Save to chrome.storage.local
    await chrome.storage.local.set({ exposures, timeline });

    // Also trigger website visit update for the domain
    await processWebsiteVisit({ domain: domain, timestamp: now });

  } catch (err) {
    console.error('RECLAIM Service Worker Storage Error:', err);
  }
}

/**
 * Transmits metadata payload to backend if available
 */
async function sendToBackend(event) {
  const backendPayload = {
    domain: normalizeDomain(event.domain),
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
