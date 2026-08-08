// popup.js - RECLAIM Extension Popup UI Controller
// Manages: Active Tab Synchronization, State Machine (loading, detected, analyzing, success, unsupported-page, error), Exposure Overview, and Recent Activity Queue

const MAX_RECENT_VISITS_DISPLAY = 5;

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await refreshUI();

  // Listen for real-time storage updates
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.recentWebsiteVisits || changes.exposures || changes.demoMode)) {
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
      alert('Privacy Dashboard is currently under development by team member and will be integrated soon!');
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
  const storage = await chrome.storage.local.get(['exposures', 'recentWebsiteVisits', 'demoMode']);
  const allExposures = storage.exposures || {};
  let visits = storage.recentWebsiteVisits || [];
  const isDemo = storage.demoMode || false;

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

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab || !activeTab.url) {
      activeTabState.status = 'error';
    } else if (isInternalUrl(activeTab.url)) {
      activeTabState.status = 'unsupported-page';
      activeTabState.url = activeTab.url;
      activeTabState.title = activeTab.title || 'Browser Internal Page';
    } else {
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

  // Render Current Active Site Card
  renderCurrentSite(activeTabState, activeExposures[activeTabState.domain]);

  // Render Overall Overview Metrics & Privacy Score
  renderExposureOverview(activeExposures);

  // Render Recent Website Activity List (rolling 5 most recently visited unique domains)
  renderRecentVisits(visits);
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
