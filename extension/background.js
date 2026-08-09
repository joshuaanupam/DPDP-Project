// background.js - RECLAIM Privacy Exposure Service Worker
// Manages: Full Exposure Database, Real Website Visit Activity (Rolling 5 Unique Domains Queue), Risk Engine, Tab Listeners, and Demo Isolation

const BACKEND_API = 'http://localhost:5000/api/events';
const MAX_EXPOSURE_RECORDS = 200; // Database limit for unique domain exposure records
const MAX_RECENT_VISITS = 5;      // Strict 5-item limit for Recent Website Activity

/**
 * Normalizes host domain for display and storage consistency (e.g. www.amazon.in -> amazon.in)
 */
function normalizeDomain(hostname) {
  if (!hostname) return '';
  let domain = hostname.toLowerCase().trim().replace(/^https?:\/\//, '');
  domain = domain.split('/')[0].split(':')[0];
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }
  return domain;
}

// In-Memory JavaScript Hash Set for O(1) domain membership checks
let visitedWebsitesSet = new Set();
let isSetInitialized = false;
let setInitializationPromise = null;
let domainRiskMap = {};

// Sequential Promise Chain Queue to prevent race conditions during concurrent tab processing
let processQueueChain = Promise.resolve();

function enqueueVisitProcessing(taskFn) {
  processQueueChain = processQueueChain.then(taskFn).catch((err) => {
    console.error('Error in visit processing queue:', err);
  });
  return processQueueChain;
}

/**
 * Ensures the in-memory JavaScript Set is initialized/rebuilt from chrome.storage.local.
 * Seeds the Set from:
 * 1. visitedWebsites array
 * 2. recentWebsiteVisits array
 * 3. exposures object keys
 * Filters out excluded domains (like google.com or internal pages).
 * Persists consolidated unique domains and webCount back to chrome.storage.local.
 */
async function initVisitedWebsitesSet() {
  if (isSetInitialized) return;
  if (setInitializationPromise) return setInitializationPromise;

  setInitializationPromise = (async () => {
    try {
      const data = await chrome.storage.local.get(['visitedWebsites', 'recentWebsiteVisits', 'exposures', 'demoMode']);
      const isDemo = data.demoMode || false;

      const storedArr = data.visitedWebsites || [];
      const recentVisits = data.recentWebsiteVisits || [];
      const exposures = data.exposures || {};

      visitedWebsitesSet = new Set();

      // 1. Seed from existing stored array
      storedArr.forEach(dom => {
        const norm = normalizeDomain(dom);
        if (norm && !isExcludedDomain(norm)) {
          visitedWebsitesSet.add(norm);
        }
      });

      // 2. Seed from existing recent visits queue
      recentVisits.forEach(v => {
        if (!isDemo && v.isDemo) return;
        const norm = normalizeDomain(v.domain);
        if (norm && !isExcludedDomain(norm)) {
          visitedWebsitesSet.add(norm);
        }
      });

      // 3. Seed from existing exposures records
      Object.keys(exposures).forEach(dom => {
        const record = exposures[dom];
        if (!isDemo && record && record.isDemo) return;
        const norm = normalizeDomain(dom);
        if (norm && !isExcludedDomain(norm)) {
          visitedWebsitesSet.add(norm);
        }
      });

      const updatedArr = Array.from(visitedWebsitesSet);
      const webCount = visitedWebsitesSet.size;

      // Update storage so all extension components share exact consolidated count
      await chrome.storage.local.set({
        visitedWebsites: updatedArr,
        webCount: webCount
      });

      isSetInitialized = true;
    } catch (err) {
      console.error('Error initializing visitedWebsitesSet:', err);
      visitedWebsitesSet = new Set();
      isSetInitialized = true;
    } finally {
      setInitializationPromise = null;
    }
  })();

  return setInitializationPromise;
}

// Initialize Set immediately on service worker startup
initVisitedWebsitesSet();

// Keep in-memory Set synchronized if storage changes externally
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.visitedWebsites) {
    visitedWebsitesSet = new Set(changes.visitedWebsites.newValue || []);
    isSetInitialized = true;
  }
});

/**
 * Filters out internal browser/extension URLs, empty tabs, and Google subdomains
 */
function isInternalUrl(urlOrDomain) {
  return isExcludedDomain(urlOrDomain);
}

/**
 * Centralized Exclusion Engine:
 * Excludes:
 * - new/empty tabs (about:blank, chrome://newtab, about:newtab, newtab)
 * - google.com and all Google subdomains (mail.google.com, maps.google.com, etc.)
 * - chrome://, edge://, about:, devtools://, file://, extension pages
 */
function isExcludedDomain(urlOrDomain) {
  if (!urlOrDomain) return true;
  const lower = urlOrDomain.toLowerCase().trim();
  
  const internalPrefixes = [
    'chrome://', 'chrome-extension://', 'edge://', 'about:',
    'devtools://', 'file://', 'blob:', 'data:', 'view-source:'
  ];
  if (internalPrefixes.some(prefix => lower.startsWith(prefix))) return true;
  if (lower === 'unknown' || lower === 'newtab' || lower === 'about:blank' || lower === 'about:newtab') return true;

  let domain = lower;
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      domain = normalizeDomain(new URL(lower).hostname);
    } catch (e) {
      return true;
    }
  } else {
    domain = normalizeDomain(lower);
  }

  if (!domain || domain === 'unknown') return true;

  // Exclude google.com and all Google subdomains / regional domains
  if (domain === 'google.com' || domain.endsWith('.google.com')) return true;
  if (/^google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(domain) || /\.google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(domain)) return true;

  return false;
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

  if (dataTypes.includes('email')) {
    score += 4;
    reasons.push('Email address collection');
  }
  if (dataTypes.includes('name')) {
    score += 4;
    reasons.push('Personal name collection');
  }
  if (dataTypes.includes('phone')) {
    score += 8;
    reasons.push('Telephone number collection');
  }
  if (dataTypes.includes('address')) {
    score += 10;
    reasons.push('Physical address collection');
  }
  if (dataTypes.includes('dob')) {
    score += 12;
    reasons.push('Age/Date of Birth collection');
  }
  if (dataTypes.includes('location')) {
    score += 10;
    reasons.push('Location coordinate collection');
  }
  if (dataTypes.includes('financial')) {
    score += 20;
    reasons.push('Financial account/payment field collection');
  }
  if (dataTypes.includes('govId')) {
    score += 20;
    reasons.push('Government identification number collection');
  }

  if (consentTypes.includes('marketing') || consentTypes.includes('promotional')) {
    score += 8;
    reasons.push('Pre-checked marketing consent checkbox');
  }

  let riskLevel = 'low';
  if (score >= 60) {
    riskLevel = 'high';
  } else if (score >= 30) {
    riskLevel = 'medium';
  }

  return {
    riskScore: Math.min(100, Math.max(0, score)),
    riskLevel,
    riskReasons: reasons
  };
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
// Initial Extension Setup (Starts Completely CLEAN in Real User Mode)
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['reclaimEnabled', 'exposureCount', 'exposures']);
  if (data.reclaimEnabled === undefined) {
    const exposures = data.exposures || {};
    const initialExposuresCount = Object.keys(exposures).length;
    await chrome.storage.local.set({
      reclaimEnabled: true,
      childSafeMode: false,
      demoMode: false,
      visitedWebsites: [],     // Fast local source of truth for unique domain strings
      webCount: 0,            // Fast local source of truth for unique website count
      exposureCount: initialExposuresCount, // Centralized exposure/account creation count
      exposures: {},            // Clean exposures DB for real user
      recentWebsiteVisits: [],  // Clean recent visits queue for real user
      timeline: []
    });
  }
});

/**
 * Active tab listener for tab switching
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && !isExcludedDomain(tab.url)) {
      const domain = normalizeDomain(new URL(tab.url).hostname);
      if (domain && !isExcludedDomain(domain)) {
        await processWebsiteVisit({ domain, url: tab.url, title: tab.title, timestamp: new Date().toISOString() });
      }
    }
  } catch (err) {
    // Ignore restricted tab access
  }
});

/**
 * Navigation / page refresh listener for active tab updates
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab && tab.active && tab.url && !isExcludedDomain(tab.url)) {
    try {
      const domain = normalizeDomain(new URL(tab.url).hostname);
      if (domain && !isExcludedDomain(domain)) {
        await processWebsiteVisit({ domain, url: tab.url, title: tab.title, timestamp: new Date().toISOString() });
      }
    } catch (err) {
      // Ignore invalid URLs
    }
  }
});

// Deduplication set for processed account creation events
const processedAccountEventsSet = new Set();

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
  } else if (message.type === 'ACCOUNT_CREATED') {
    handleAccountCreation(message);
    sendToBackend(message);
  } else if (message.type === 'UPDATE_CLEANUP_STATUS') {
    handleUpdateCleanupStatus(message.domain, message.status);
  } else if (message.type === 'TOGGLE_DEMO_MODE') {
    handleToggleDemoMode(message.enableDemo);
  } else if (message.type === 'TOGGLE_CHILD_SAFE_MODE') {
    handleToggleChildSafeMode(message.enableChildSafeMode);
  } else if (message.type === 'CLEAR_ALL_DATA') {
    handleClearAllData();
  } else if (message.type === 'GET_CLEANUP_INFO') {
    const info = getCleanupMethod(message.domain);
    sendResponse(info);
    return true;
  } else if (message.type === 'GET_EXTENSION_STATE' || message.type === 'GET_SITE_DATA') {
    handleGetExtensionState(message.domain || '').then(sendResponse).catch(() => sendResponse(null));
    return true; // async sendResponse
  }
});

/**
 * Handles confirmed Account Creation Events.
 * Increments exposureCount by exactly 1 per successful account creation.
 * Work for new users, signed-in users, or multiple accounts on same website.
 */
async function handleAccountCreation(event) {
  const domain = normalizeDomain(event.domain);
  if (!domain || isExcludedDomain(domain)) return;

  const eventId = event.eventId || `acct_${domain}_${event.timestamp}`;
  if (processedAccountEventsSet.has(eventId)) return; // Deduplication guard
  processedAccountEventsSet.add(eventId);

  const storage = await chrome.storage.local.get(['exposureCount', 'exposures', 'timeline', 'reclaimEnabled']);
  if (storage.reclaimEnabled === false) return;

  let exposureCount = typeof storage.exposureCount === 'number' ? storage.exposureCount : Object.keys(storage.exposures || {}).length;
  let exposures = storage.exposures || {};
  let timeline = storage.timeline || [];

  // Increment exposureCount by exactly 1
  exposureCount += 1;

  const now = event.timestamp || new Date().toISOString();
  const existing = exposures[domain];

  if (existing) {
    exposures[domain] = {
      ...existing,
      lastSeen: now,
      accountExposure: 'confirmed',
      eventCount: (existing.eventCount || 1) + 1,
      riskLevel: 'high',
      riskReasons: Array.from(new Set([...(existing.riskReasons || []), 'Confirmed Account Creation']))
    };
  } else {
    exposures[domain] = {
      id: 'exp_' + Math.random().toString(36).substring(2, 11),
      domain: domain,
      firstSeen: now,
      lastSeen: now,
      dataTypes: ['account', 'email'],
      consentTypes: ['essential'],
      eventCount: 1,
      accountExposure: 'confirmed',
      riskLevel: 'high',
      riskReasons: ['Confirmed Account Creation'],
      cleanupStatus: 'RECOMMENDED'
    };
  }

  timeline.unshift({
    domain: domain,
    action: `New Account Created (${event.confirmationSignal || 'Confirmed'})`,
    timestamp: now
  });
  if (timeline.length > 50) timeline = timeline.slice(0, 50);

  await chrome.storage.local.set({
    exposureCount: exposureCount,
    exposures: exposures,
    timeline: timeline
  });

  // Broadcast immediate update to UI
  chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});
  broadcastToContentScripts();

  // Non-blocking async sync
  syncVisitToGoogleDocs({ domain, eventType: 'ACCOUNT_CREATED', timestamp: now }).catch(() => {});
}

/**
 * Toggles Child Safe Mode (§9 Protection)
 */
async function handleToggleChildSafeMode(enableChildSafeMode) {
  await chrome.storage.local.set({ childSafeMode: !!enableChildSafeMode });
  chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});
  broadcastToContentScripts();
}

/**
 * Calculates overall privacy health score (0-100) based on exposure database
 */
function calculatePrivacyScore(exposuresObj) {
  const records = Object.values(exposuresObj || {});
  if (records.length === 0) return 100;

  let score = 100;

  records.forEach(rec => {
    if (rec.riskLevel === 'high') score -= 10;
    else if (rec.riskLevel === 'medium') score -= 5;
    else score -= 2;

    if (rec.consentTypes && rec.consentTypes.includes('marketing')) {
      score -= 2;
    }
  });

  return Math.max(15, Math.min(100, score));
}

/**
 * Single Authoritative Extension State Contract
 */
async function handleGetExtensionState(domain = '') {
  await initVisitedWebsitesSet();

  const storage = await chrome.storage.local.get([
    'exposures',
    'recentWebsiteVisits',
    'demoMode',
    'reclaimEnabled',
    'childSafeMode',
    'exposureCount'
  ]);

  const allExposures = storage.exposures || {};
  let recentVisits = storage.recentWebsiteVisits || [];
  const isDemo = storage.demoMode || false;
  const enabled = storage.reclaimEnabled !== false;
  const childSafeMode = storage.childSafeMode || false;

  const visitedWebsites = Array.from(visitedWebsitesSet);
  const webCount = visitedWebsitesSet.size;
  const exposureCount = typeof storage.exposureCount === 'number'
    ? storage.exposureCount
    : Object.keys(allExposures).length;

  // Filter exposures based on demo mode
  const activeExposures = {};
  Object.keys(allExposures).forEach(key => {
    const record = allExposures[key];
    if (isDemo || !record.isDemo) {
      activeExposures[key] = record;
    }
  });

  if (!isDemo) {
    recentVisits = recentVisits.filter(v => !v.isDemo);
  }

  const normalizedDomain = domain ? normalizeDomain(domain) : '';
  const cachedRisk = normalizedDomain ? domainRiskMap[normalizedDomain] : null;

  return {
    webCount: webCount,
    exposureCount: exposureCount,
    visitedWebsites: visitedWebsites,
    recentWebsiteVisits: recentVisits,
    exposures: activeExposures,
    siteExposure: normalizedDomain ? (activeExposures[normalizedDomain] || null) : null,
    siteRisk: cachedRisk,
    privacyScore: calculatePrivacyScore(activeExposures),
    demoMode: isDemo,
    enabled: enabled,
    childSafeMode: childSafeMode
  };
}

/**
 * Backwards compatible alias
 */
async function handleGetSiteData(domain) {
  return handleGetExtensionState(domain);
}

/**
 * Broadcasts a data update to all content scripts so overlays refresh live
 */
async function broadcastToContentScripts() {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !isExcludedDomain(tab.url)) {
        chrome.tabs.sendMessage(tab.id, { type: 'OVERLAY_DATA_UPDATE' }).catch(() => {});
      }
    }
  } catch (err) {
    // Ignore errors when tabs are not accessible
  }
}

/**
 * Processes Real Website Navigation Visit
 * O(1) Hash Set membership check algorithm with serialized promise queueing to prevent race conditions.
 *
 * Algorithm:
 * 1. Extract and normalize hostname
 * 2. Check exclusion engine (new tab, internal pages, google domains)
 * 3. Enqueue visit processing sequentially
 * 4. O(1) check: visitedWebsitesSet.has(domain)
 * 5. If domain DOES NOT exist:
 *    - visitedWebsitesSet.add(domain)
 *    - increment webCount
 *    - persist updated Array.from(visitedWebsitesSet) & webCount to chrome.storage.local
 *    - notify UI
 *    - trigger non-blocking async Google Docs sync
 * 6. If domain ALREADY exists:
 *    - do nothing
 */
async function processWebsiteVisit(data) {
  const rawUrl = data.url || '';
  const rawDomain = data.domain || '';

  if (isExcludedDomain(rawUrl) || isExcludedDomain(rawDomain)) {
    return; // Exclude internal browser pages, new tabs, and google domains
  }

  let domain = '';
  if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
    try {
      domain = normalizeDomain(new URL(rawUrl).hostname);
    } catch (e) {
      domain = normalizeDomain(rawDomain);
    }
  } else {
    domain = normalizeDomain(rawDomain);
  }

  if (!domain || isExcludedDomain(domain)) return;

  if (data.riskScore !== undefined) {
    domainRiskMap[domain] = {
      riskScore: data.riskScore,
      riskLevel: data.riskLevel,
      riskReasons: data.riskReasons
    };
  }

  // Enqueue processing to prevent race conditions when multiple tabs open concurrently
  return enqueueVisitProcessing(async () => {
    await initVisitedWebsitesSet();

    const storage = await chrome.storage.local.get(['recentWebsiteVisits', 'reclaimEnabled', 'demoMode']);
    
    // Stop recording if RECLAIM is disabled by user
    if (storage.reclaimEnabled === false) return;

    const isDemo = storage.demoMode || false;
    let visits = storage.recentWebsiteVisits || [];
    const now = data.timestamp || new Date().toISOString();

    // Step 1: O(1) Hash Set Membership Check
    const exists = visitedWebsitesSet.has(domain);
    let isNewUniqueVisit = false;

    console.log(`[PrivacyLens Extension] Detected domain: ${data.domain || rawDomain || rawUrl}`);
    console.log(`[PrivacyLens Extension] Normalized domain: ${domain}`);
    console.log(`[PrivacyLens Extension] Existing website found: ${exists}`);
    console.log(`[PrivacyLens Extension] New website: ${!exists}`);

    // Step 2: If domain does NOT exist in Set -> add, update webCount, persist to chrome.storage.local
    if (!exists) {
      visitedWebsitesSet.add(domain);
      isNewUniqueVisit = true;

      const updatedArray = Array.from(visitedWebsitesSet);
      const webCount = visitedWebsitesSet.size;

      await chrome.storage.local.set({
        visitedWebsites: updatedArray,
        webCount: webCount
      });
    }

    // Step 3: Update Recent Website Activity list (rolling 5)
    visits = visits.filter(v => normalizeDomain(v.domain) !== domain);
    visits.unshift({
      domain: domain,
      timestamp: now,
      isDemo: isDemo
    });

    if (visits.length > MAX_RECENT_VISITS) {
      visits = visits.slice(0, MAX_RECENT_VISITS);
    }

    await chrome.storage.local.set({ recentWebsiteVisits: visits });

    // Step 4: Broadcast immediate update to UI
    chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});
    broadcastToContentScripts();

    // Step 5: Asynchronously sync to Google Docs / external backend (non-blocking)
    syncVisitToGoogleDocs({
      domain,
      timestamp: now,
      riskScore: data.riskScore,
      riskLevel: data.riskLevel,
      riskReasons: data.riskReasons
    }).catch(() => {});
  });
}

/**
 * Asynchronously syncs visit metadata to Google Docs / external backend without blocking real-time count
 */
async function syncVisitToGoogleDocs(visitData) {
  const storage = await chrome.storage.local.get(['session']);
  const userId = (storage.session && storage.session.user && storage.session.user.id) ? storage.session.user.id : 'usr_12345';

  const payload = {
    userId,
    domain: visitData.domain,
    eventType: 'WEBSITE_VISIT',
    timestamp: visitData.timestamp,
    source: 'PRIVACY_LENS_AUTO_SYNC',
    riskScore: typeof visitData.riskScore === 'number' ? visitData.riskScore : 8,
    riskLevel: visitData.riskLevel || 'Low',
    riskReasons: Array.isArray(visitData.riskReasons) ? visitData.riskReasons : []
  };

  try {
    const res = await fetch(BACKEND_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      // Sync any offline pending events
      syncPendingEvents().catch(() => {});
    } else {
      await enqueuePendingEvent(payload);
    }
  } catch (err) {
    // Offline resilience - queue pending event
    await enqueuePendingEvent(payload);
  }
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
      broadcastToContentScripts();
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
  broadcastToContentScripts();
}

/**
 * Clears all local exposure & activity data
 */
async function handleClearAllData() {
  visitedWebsitesSet.clear();
  await chrome.storage.local.set({
    exposures: {},
    recentWebsiteVisits: [],
    visitedWebsites: [],
    webCount: 0,
    exposureCount: 0,
    timeline: [],
    demoMode: false
  });
  chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});
  broadcastToContentScripts();
}

/**
 * Process incoming form submission event.
 * Records EXPOSURE in main exposures DB (not website visit queue).
 */
async function processExposureEvent(event) {
  try {
    const domain = normalizeDomain(event.domain);
    if (domain && event.riskScore !== undefined) {
      domainRiskMap[domain] = {
        riskScore: event.riskScore,
        riskLevel: event.riskLevel,
        riskReasons: event.riskReasons
      };
    }

    const storageData = await chrome.storage.local.get(['exposures', 'timeline', 'reclaimEnabled']);
    if (storageData.reclaimEnabled === false) return;

    let exposures = storageData.exposures || {};
    let timeline = storageData.timeline || [];
    if (!domain || isInternalUrl(domain)) return;

    const now = new Date().toISOString();
    const existing = exposures[domain];
    const exists = !!existing;

    console.log(`[PrivacyLens Extension] Login detected: true`);
    console.log(`[PrivacyLens Extension] Exposure already exists: ${exists}`);

    const riskLvl = event.riskLevel ? event.riskLevel.toLowerCase() : evaluateRisk(event.dataTypes || [], event.consents || [], now).riskLevel;
    const riskReas = event.riskReasons || evaluateRisk(event.dataTypes || [], event.consents || [], now).riskReasons;

    if (existing) {
      const mergedDataTypes = Array.from(new Set([...(existing.dataTypes || []), ...(event.dataTypes || [])]));
      const mergedConsentTypes = Array.from(new Set([...(existing.consentTypes || []), ...(event.consents || [])]));

      exposures[domain] = {
        ...existing,
        lastSeen: now,
        dataTypes: mergedDataTypes,
        consentTypes: mergedConsentTypes,
        eventCount: (existing.eventCount || 1) + 1,
        riskLevel: riskLvl,
        riskReasons: riskReas
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
        riskLevel: riskLvl,
        riskReasons: riskReas,
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
  const storage = await chrome.storage.local.get(['session']);
  const userId = (storage.session && storage.session.user && storage.session.user.id) ? storage.session.user.id : 'usr_12345';

  const backendPayload = {
    userId,
    domain: normalizeDomain(event.domain),
    dataTypes: event.dataTypes || [],
    consents: event.consents || [],
    eventType: event.eventType || 'FORM_SUBMISSION',
    timestamp: event.timestamp,
    eventId: event.eventId,
    riskScore: typeof event.riskScore === 'number' ? event.riskScore : 10,
    riskLevel: event.riskLevel || 'Low',
    riskReasons: Array.isArray(event.riskReasons) ? event.riskReasons : []
  };

  try {
    const res = await fetch(BACKEND_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPayload)
    });
    if (res.ok) {
      syncPendingEvents().catch(() => {});
    } else {
      await enqueuePendingEvent(backendPayload);
    }
  } catch (err) {
    // Offline resilience - queue pending event
    await enqueuePendingEvent(backendPayload);
  }
}

// ==========================================
// REAL-TIME SSE SYNC INFRASTRUCTURE (MV3 COMPATIBLE)
// ==========================================

let sseConnection = null;

async function startSseSync(userId) {
  if (sseConnection) {
    sseConnection.abort();
    sseConnection = null;
  }

  const controller = new AbortController();
  sseConnection = controller;

  console.log(`[PrivacyLens Sync] Establishing real-time connection for user ${userId}...`);

  try {
    const response = await fetch(`http://localhost:5000/api/realtime/${userId}`, {
      signal: controller.signal
    });

    if (!response.body) {
      console.error('[PrivacyLens Sync] Real-time stream failed: empty response body.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Sync any pending offline events upon reconnect
    syncPendingEvents().catch(() => {});

    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            console.log(`[PrivacyLens Sync] Website count: ${data.websiteCount}`);
            console.log(`[PrivacyLens Sync] Exposure count: ${data.exposureCount}`);

            // 1. Sync visitedWebsitesSet in-memory
            const domains = (data.records || []).map(r => r.domain);
            visitedWebsitesSet = new Set(domains);

            // 2. Sync local exposures object from backend
            const localData = await chrome.storage.local.get(['exposures']);
            const exposures = localData.exposures || {};
            let exposuresChanged = false;

            (data.records || []).forEach(backendRec => {
              const dom = backendRec.domain;
              if (backendRec.loginDetected) {
                const backRisk = (backendRec.riskLevel || 'medium').toLowerCase();
                const backReasons = backendRec.riskReasons || ['Detected Account relationship'];
                if (!exposures[dom]) {
                  exposures[dom] = {
                    id: 'exp_' + Math.random().toString(36).substring(2, 11),
                    domain: dom,
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString(),
                    dataTypes: ['email'],
                    consentTypes: ['essential'],
                    eventCount: 1,
                    accountExposure: 'possible',
                    riskLevel: backRisk,
                    riskReasons: backReasons,
                    cleanupStatus: 'RECOMMENDED'
                  };
                  exposuresChanged = true;
                } else {
                  if (exposures[dom].accountExposure !== 'confirmed' && exposures[dom].accountExposure !== 'possible') {
                    exposures[dom].accountExposure = 'possible';
                    exposuresChanged = true;
                  }
                  if (exposures[dom].riskLevel !== backRisk || JSON.stringify(exposures[dom].riskReasons) !== JSON.stringify(backReasons)) {
                    exposures[dom].riskLevel = backRisk;
                    exposures[dom].riskReasons = backReasons;
                    exposuresChanged = true;
                  }
                }
              } else {
                // Remove login exposure locally if database indicates no loginDetected
                if (exposures[dom]) {
                  delete exposures[dom];
                  exposuresChanged = true;
                }
              }
            });

            const storageUpdate = {
              webCount: data.websiteCount,
              exposureCount: data.exposureCount,
              visitedWebsites: domains
            };

            if (exposuresChanged) {
              storageUpdate.exposures = exposures;
            }

            await chrome.storage.local.set(storageUpdate);

            // Trigger local extension UI updates
            chrome.runtime.sendMessage({ type: 'DATA_UPDATED' }).catch(() => {});
          } catch (e) {
            console.error('[PrivacyLens Sync] Failed to parse real-time update payload:', e);
          }
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('[PrivacyLens Sync] Connection lost. Reconnecting in 5s...', err.message);
      setTimeout(() => startSseSync(userId), 5000);
    }
  }
}

async function enqueuePendingEvent(payload) {
  try {
    const data = await chrome.storage.local.get(['pendingPrivacyEvents']);
    const queue = data.pendingPrivacyEvents || [];
    // Deduplicate in the queue by matching domain & eventType
    const duplicate = queue.some(item => item.domain === payload.domain && item.eventType === payload.eventType);
    if (!duplicate) {
      queue.push(payload);
      await chrome.storage.local.set({ pendingPrivacyEvents: queue });
      console.log('[PrivacyLens Sync] Event queued offline:', payload.domain);
    }
  } catch (err) {
    console.error('[PrivacyLens Sync] Failed to queue event:', err);
  }
}

async function syncPendingEvents() {
  try {
    const data = await chrome.storage.local.get(['pendingPrivacyEvents']);
    const queue = data.pendingPrivacyEvents || [];
    if (queue.length === 0) return;

    console.log(`[PrivacyLens Sync] Syncing ${queue.length} pending offline events...`);
    for (const event of queue) {
      await fetch(BACKEND_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    }

    await chrome.storage.local.set({ pendingPrivacyEvents: [] });
    console.log('[PrivacyLens Sync] Offline queue synced successfully.');
  } catch (err) {
    console.error('[PrivacyLens Sync] Offline queue sync failed:', err.message);
  }
}

// Start SSE connection on startup
chrome.storage.local.get(['session'], (data) => {
  const userId = (data.session && data.session.user && data.session.user.id) ? data.session.user.id : 'usr_12345';
  startSseSync(userId);
});

// Reconnect if session changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.session) {
    const session = changes.session.newValue;
    const userId = (session && session.user && session.user.id) ? session.user.id : 'usr_12345';
    startSseSync(userId);
  }
});
