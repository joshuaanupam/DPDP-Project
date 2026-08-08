// popup.js - RECLAIM Extension Popup UI Controller

const MAX_RECENT_VISITS_DISPLAY = 5;

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await refreshUI();

  // Listen for real-time storage updates (instantly updates open popup when user navigates or submits)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.recentWebsiteVisits || changes.exposures || changes.demoMode)) {
      refreshUI();
    }
  });

  // Also listen for runtime message updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'DATA_UPDATED' || message.type === 'EVENTS_UPDATED') {
      refreshUI();
    }
  });
});

function setupEventListeners() {
  const btnDashboard = document.getElementById('btn-open-dashboard');
  if (btnDashboard) {
    btnDashboard.addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:5173' });
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
 * Main UI refresh loop
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

  // 1. Fetch current active tab domain
  let currentDomain = '';
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.url) {
      const urlObj = new URL(activeTab.url);
      if (urlObj.protocol.startsWith('http')) {
        currentDomain = normalizeDomain(urlObj.hostname);
      }
    }
  } catch (e) {
    console.error('Failed to parse current tab URL:', e);
  }

  // Render Current Site Section (uses activeExposures)
  renderCurrentSite(currentDomain, activeExposures[currentDomain]);

  // Render Overall Overview Metrics & Privacy Score
  renderExposureOverview(activeExposures);

  // Render Recent Website Activity List (rolling 5 most recently visited unique domains)
  renderRecentVisits(visits);
}

/**
 * Renders the active site card
 */
function renderCurrentSite(domain, siteExposure) {
  const domainEl = document.getElementById('current-domain');
  const statusEl = document.getElementById('exposure-status');
  const riskPill = document.getElementById('site-risk-pill');
  const badgesContainer = document.getElementById('detected-badges');

  domainEl.textContent = domain || 'Internal / Special Page';

  if (!domain || !siteExposure) {
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
