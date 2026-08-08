// popup.js - RECLAIM Extension Popup UI Controller
// Manages: Active Tab Synchronization, State Machine (loading, detected, analyzing, success, unsupported-page, error), Exposure Overview, and Recent Activity Queue

const MAX_RECENT_VISITS_DISPLAY = 5;

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await refreshUI();

  // Listen for real-time storage updates
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.recentWebsiteVisits || changes.exposures || changes.demoMode || changes.session)) {
      refreshUI();
    }
  });

  // Listen for runtime message updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'DATA_UPDATED' || message.type === 'EVENTS_UPDATED') {
      refreshUI();
    }
  });

  // Listen for active tab switching while popup is open
  if (chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener(() => {
      refreshUI();
    });
  }

  // Listen for tab navigation/refresh while popup is open
  if (chrome.tabs && chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        refreshUI();
      }
    });
  }
});

function setupEventListeners() {
  const btnDashboard = document.getElementById('btn-open-dashboard');
  if (btnDashboard) {
    btnDashboard.addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:5173' });
    });
  }

  const toggleChildSafe = document.getElementById('toggle-child-safe');
  if (toggleChildSafe) {
    toggleChildSafe.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      await chrome.storage.local.set({ childSafeMode: enabled });
      chrome.runtime.sendMessage({ type: 'TOGGLE_CHILD_SAFE_MODE', enableChildSafeMode: enabled }).catch(() => {});
      refreshUI();
    });
  }

  const btnLoginRedirect = document.getElementById('btn-login-redirect');
  if (btnLoginRedirect) {
    btnLoginRedirect.addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:5173' });
    });
  }

  const btnRefreshBrief = document.getElementById('btn-refresh-brief');
  if (btnRefreshBrief) {
    btnRefreshBrief.addEventListener('click', async () => {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url && !isInternalUrl(activeTab.url)) {
          const urlObj = new URL(activeTab.url);
          const domain = normalizeDomain(urlObj.hostname);
          const activeTabState = {
            domain: domain,
            url: activeTab.url,
            title: activeTab.title || urlObj.hostname,
            status: 'success'
          };
          await loadWebsiteBrief(activeTabState, activeTab.id, true);
        }
      } catch (err) {
        console.error('Refresh brief click error:', err);
      }
    });
  }
}

/**
 * Reusable domain normalizer (e.g. https://www.amazon.in/product -> amazon.in)
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
 * Checks if a URL is an internal browser/extension page
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
 * Main UI refresh loop - Single Source of Truth from active browser tab
 */
async function refreshUI() {
  const storage = await chrome.storage.local.get(['exposures', 'recentWebsiteVisits', 'demoMode', 'childSafeMode', 'session']);
  
  // Verify user is authenticated before showing metrics
  const lockOverlay = document.getElementById('lock-overlay');
  if (!storage.session) {
    if (lockOverlay) lockOverlay.style.display = 'flex';
    document.getElementById('privacy-score-badge').textContent = 'Locked';
    document.getElementById('privacy-score-badge').style.borderColor = '#64748b';
    return;
  }
  if (lockOverlay) lockOverlay.style.display = 'none';
  const allExposures = storage.exposures || {};
  let visits = storage.recentWebsiteVisits || [];
  const isDemo = storage.demoMode || false;
  const isChildSafe = storage.childSafeMode || false;

  // Update Child Safe Mode toggle UI
  const toggleChildSafe = document.getElementById('toggle-child-safe');
  if (toggleChildSafe) {
    toggleChildSafe.checked = isChildSafe;
  }

  // Filter exposure records and visits based on Demo Mode isolation
  const activeExposures = {};
  Object.keys(allExposures).forEach(domainKey => {
    const record = allExposures[domainKey];
    if (isDemo || !record.isDemo) {
      activeExposures[domainKey] = record;
    }
  });

  if (!isDemo) {
    visits = visits.filter(v => !v.isDemo);
  }

  // Active Tab State Machine
  let activeTabState = {
    status: 'loading', // loading | detected | analyzing | success | unsupported-page | error
    domain: '',
    title: '',
    url: '',
    protocol: ''
  };

  let activeTabId = null;

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab || !activeTab.url) {
      activeTabState.status = 'error';
    } else if (isInternalUrl(activeTab.url)) {
      activeTabState.status = 'unsupported-page';
      activeTabState.url = activeTab.url;
      activeTabState.title = activeTab.title || 'Browser Internal Page';
    } else {
      activeTabId = activeTab.id;
      const urlObj = new URL(activeTab.url);
      activeTabState.status = 'success';
      activeTabState.domain = normalizeDomain(urlObj.hostname);
      activeTabState.url = activeTab.url;
      activeTabState.title = activeTab.title || urlObj.hostname;
      activeTabState.protocol = urlObj.protocol.replace(':', '').toUpperCase();
    }
  } catch (e) {
    activeTabState.status = 'error';
  }

  // Check webpage for indicators of behavioral tracking or targeted ads (§9)
  let hasBehavioralTracking = false;

  const currentExposure = activeExposures[activeTabState.domain];
  if (currentExposure) {
    // Check if recorded consent types include marketing/promotional or if risk reasons indicate tracking
    if ((currentExposure.consentTypes || []).some(c => c === 'marketing' || c === 'promotional')) {
      hasBehavioralTracking = true;
    }
    if ((currentExposure.riskReasons || []).some(r => r.toLowerCase().includes('marketing') || r.toLowerCase().includes('tracking'))) {
      hasBehavioralTracking = true;
    }
  }

  // Send query message to content script on active tab for real-time DOM script/ad-tech parsing
  if (activeTabId && activeTabState.status === 'success') {
    try {
      const trackingRes = await chrome.tabs.sendMessage(activeTabId, { type: 'CHECK_BEHAVIORAL_TRACKING' }).catch(() => null);
      if (trackingRes && trackingRes.hasBehavioralTracking) {
        hasBehavioralTracking = true;
      }
    } catch (err) {}
  }

  // Render Current Active Site Card
  renderCurrentSite(activeTabState, currentExposure);

  // Render Child Safe Alert (§9) if Child Safe Mode is enabled AND behavioral tracking is detected
  renderChildSafeAlert(isChildSafe, hasBehavioralTracking);

  // Render Overall Overview Metrics & Privacy Score
  renderExposureOverview(activeExposures);

  // Render Recent Website Activity List (rolling 5 most recently visited unique domains)
  renderRecentVisits(visits);

  // Load and Render Website Brief Feature
  await loadWebsiteBrief(activeTabState, activeTabId);
}

/**
 * Renders Child Safe Mode Alert (§9) if active user is flagged as a child / child safe mode is active
 */
function renderChildSafeAlert(isChildSafe, hasBehavioralTracking) {
  const alertContainer = document.getElementById('child-safe-alert-container');
  if (!alertContainer) return;

  if (isChildSafe && hasBehavioralTracking) {
    alertContainer.innerHTML = `
      <div class="alert-chip-child" id="child-safe-warning-alert">
        ⚠️ WARNING: Children's Behavioral Tracking Detected (§9)
      </div>
    `;
  } else {
    alertContainer.innerHTML = '';
  }
}

/**
 * Renders the active site card with full state management
 */
function renderCurrentSite(activeTabState, siteExposure) {
  const domainEl = document.getElementById('current-domain');
  const statusEl = document.getElementById('exposure-status');
  const riskPill = document.getElementById('site-risk-pill');
  const badgesContainer = document.getElementById('detected-badges');

  if (activeTabState.status === 'loading') {
    domainEl.textContent = 'Detecting website...';
    statusEl.innerHTML = '🔄 <span style="color: #64748b;">Analyzing active browser tab...</span>';
    riskPill.className = 'risk-pill risk-low';
    riskPill.textContent = 'LOADING';
    badgesContainer.innerHTML = '<span class="chip">Checking...</span>';
    return;
  }

  if (activeTabState.status === 'unsupported-page') {
    domainEl.textContent = 'Internal / Special Page';
    statusEl.innerHTML = 'ℹ️ <span style="color: #64748b;">This page cannot be analyzed by the extension.</span>';
    riskPill.className = 'risk-pill risk-low';
    riskPill.textContent = 'UNSUPPORTED';
    badgesContainer.innerHTML = '<span class="chip">Internal Page</span>';
    return;
  }

  if (activeTabState.status === 'error') {
    domainEl.textContent = 'Unknown Page';
    statusEl.innerHTML = '⚠️ <span style="color: #ef4444;">Unable to retrieve website information. Try again.</span>';
    riskPill.className = 'risk-pill risk-high';
    riskPill.textContent = 'ERROR';
    badgesContainer.innerHTML = '<span class="chip">Error</span>';
    return;
  }

  // Active website detected successfully
  const domain = activeTabState.domain;
  const protocolBadge = activeTabState.protocol === 'HTTPS' ? '🔒 HTTPS' : '⚠️ HTTP';
  domainEl.innerHTML = `${domain} <span style="font-size: 11px; font-weight: normal; color: #64748b; margin-left: 6px;">(${protocolBadge})</span>`;

  if (!siteExposure) {
    statusEl.innerHTML = '⚡ <span style="color: #64748b;">No exposure recorded on this domain yet.</span>';
    riskPill.className = 'risk-pill risk-low';
    riskPill.textContent = 'CLEAN';
    badgesContainer.innerHTML = '<span class="chip">No Data Captured</span>';
    return;
  }

  // Exposure recorded for current domain
  statusEl.innerHTML = '⚠️ <span style="color: #0369a1;">Digital Exposure Detected</span>';

  const risk = (siteExposure.riskLevel || 'low').toLowerCase();
  riskPill.className = `risk-pill risk-${risk}`;
  riskPill.textContent = risk.toUpperCase();

  badgesContainer.innerHTML = '';

  // Render data category chips
  (siteExposure.dataTypes || []).forEach(type => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    badgesContainer.appendChild(chip);
  });

  // Render consent category chips
  (siteExposure.consentTypes || []).forEach(consent => {
    const chip = document.createElement('span');
    chip.className = 'chip chip-consent';
    chip.textContent = consent.charAt(0).toUpperCase() + consent.slice(1) + ' Consent';
    badgesContainer.appendChild(chip);
  });
}

/**
 * Renders digital exposure metrics & calculated privacy score
 */
function renderExposureOverview(exposures) {
  const records = Object.values(exposures || {});
  
  const totalWebsites = records.length;
  const totalExposures = records.reduce((acc, r) => acc + (r.eventCount || 1), 0);
  const highRiskCount = records.filter(r => r.riskLevel === 'high').length;

  document.getElementById('stat-websites').textContent = totalWebsites;
  document.getElementById('stat-accounts').textContent = totalExposures;
  document.getElementById('stat-high-risk').textContent = highRiskCount;

  // Calculate and update score
  const score = calculatePrivacyScore(exposures);
  const scoreBadge = document.getElementById('privacy-score-badge');
  scoreBadge.textContent = `Score: ${score}/100`;

  if (score < 50) scoreBadge.style.borderColor = '#ef4444';
  else if (score < 75) scoreBadge.style.borderColor = '#f59e0b';
  else scoreBadge.style.borderColor = '#10b981';
}

/**
 * Renders Recent Website Activity (Rolling 5 Most Recently Visited Unique Domains)
 */
function renderRecentVisits(visits) {
  const listEl = document.getElementById('recent-exposure-list');
  if (!listEl) return;
  
  if (!visits || visits.length === 0) {
    listEl.innerHTML = '<div style="font-size: 12px; color: #94a3b8; text-align: center; padding: 12px 0;">No recent website activity.</div>';
    return;
  }

  listEl.innerHTML = '';

  // Take maximum 5 unique domain visits (newest at TOP)
  const displayVisits = visits.slice(0, MAX_RECENT_VISITS_DISPLAY);

  displayVisits.forEach(v => {
    const item = document.createElement('div');
    item.className = 'recent-item';

    const normalizedDom = normalizeDomain(v.domain);
    
    // Format timestamp to user-friendly time string (e.g. 02:16 PM)
    let formattedTime = '';
    if (v.timestamp) {
      try {
        formattedTime = new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        formattedTime = '';
      }
    }

    const demoBadge = v.isDemo ? '<span style="font-size:9px; background:#fef3c7; color:#92400e; padding:1px 4px; border-radius:3px; margin-left:4px;">DEMO</span>' : '';

    item.innerHTML = `
      <div>
        <strong style="color: #1e293b;">${normalizedDom}</strong> ${demoBadge}
      </div>
      <span style="font-size: 11px; color: #64748b; font-weight: 500;">${formattedTime}</span>
    `;

    listEl.appendChild(item);
  });
}

/**
 * Loads, caches, and renders the AI-powered Website Brief.
 * Uses message passing to fetch DOM metadata from content script,
 * then fetches from backend controller and caches in local storage.
 */
async function loadWebsiteBrief(activeTabState, activeTabId, forceRefresh = false) {
  const card = document.getElementById('website-brief-card');
  const siteTitle = document.getElementById('brief-site-title');
  const textEl = document.getElementById('brief-text');

  if (!card || !siteTitle || !textEl) return;

  // 1. Safe visibility guard: Hide brief card on loading, internal, or error tab states
  if (activeTabState.status !== 'success' || !activeTabState.domain) {
    card.style.display = 'none';
    return;
  }

  const domain = activeTabState.domain;
  card.style.display = 'block';

  // 2. Local Storage Cache Check
  const storage = await chrome.storage.local.get('websiteBriefs');
  const briefs = storage.websiteBriefs || {};

  if (briefs[domain] && !forceRefresh) {
    siteTitle.textContent = briefs[domain].siteName || domain;
    textEl.textContent = briefs[domain].brief;
    return;
  }

  // 3. Initiate summary fetch
  siteTitle.textContent = domain;
  textEl.innerHTML = '🔄 <span style="color: #64748b; font-style: italic;">Generating AI summary...</span>';

  // Extract metadata (title, headings, descriptions) using content script message passing
  let domMetadata = {
    title: activeTabState.title,
    metaDescription: '',
    headings: []
  };

  if (activeTabId) {
    try {
      const response = await chrome.tabs.sendMessage(activeTabId, { type: 'GET_DOM_METADATA' }).catch(() => null);
      if (response) {
        domMetadata = response;
      }
    } catch (e) {
      console.warn('Could not contact content script for DOM metadata:', e.message);
    }
  }

  // Submit to backend API securely (protects Gemini API key on the backend)
  try {
    const apiResponse = await fetch('http://localhost:5000/api/ai/website-brief', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        domain: domain,
        title: domMetadata.title || activeTabState.title,
        metaDescription: domMetadata.metaDescription || '',
        headings: domMetadata.headings || []
      })
    });

    const data = await apiResponse.json();
    if (data && data.success) {
      // Update Cache
      briefs[domain] = {
        siteName: data.siteName,
        brief: data.brief
      };
      await chrome.storage.local.set({ websiteBriefs: briefs });

      // Display
      siteTitle.textContent = data.siteName || domain;
      textEl.textContent = data.brief;
    } else {
      textEl.textContent = data.brief || 'Unable to generate a reliable website summary.';
    }
  } catch (err) {
    console.error('Error fetching website brief:', err);
    textEl.textContent = 'Website summary unavailable.';
  }
}
