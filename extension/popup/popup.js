// popup.js - RECLAIM Extension Popup UI Controller

const MAX_RECENT_EVENTS_DISPLAY = 5;

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await refreshUI();

  // Listen for real-time storage updates (instantly updates open popup when 6th/7th event occurs)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.recentEvents || changes.exposures)) {
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
      alert('Privacy Dashboard is currently under development by team member and will be integrated soon!');
    });
  }
}

/**
 * Reusable domain normalizer (e.g. www.amazon.in -> amazon.in)
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
 * Calculates overall privacy health score (0-100) based on full exposure database
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
  const storage = await chrome.storage.local.get(['exposures', 'recentEvents']);
  const exposures = storage.exposures || {};
  const recentEvents = storage.recentEvents || [];

  // 1. Fetch current tab domain
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

  // Render Current Site Section
  renderCurrentSite(currentDomain, exposures[currentDomain]);

  // Render Overall Overview Metrics & Privacy Score (from Full Exposure Database)
  renderExposureOverview(exposures);

  // Render Recent Exposure Activity (Rolling 5-Event List)
  renderRecentEvents(recentEvents, exposures);
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
 * Renders recent exposure history (Strictly 5 Most Recent Events in Chronological Recency Order)
 */
function renderRecentEvents(recentEvents, exposures) {
  const listEl = document.getElementById('recent-exposure-list');
  
  if (!recentEvents || recentEvents.length === 0) {
    listEl.innerHTML = '<div class="no-events" style="font-size: 12px; color: #94a3b8; text-align: center; padding: 12px 0;">No recent exposure events.</div>';
    return;
  }

  listEl.innerHTML = '';

  // Take maximum 5 events (index 0 is newest)
  const displayEvents = recentEvents.slice(0, MAX_RECENT_EVENTS_DISPLAY);

  displayEvents.forEach(evt => {
    const item = document.createElement('div');
    item.className = 'recent-item';

    const normalizedDom = normalizeDomain(evt.domain);
    const siteExp = exposures[normalizedDom];
    const risk = evt.riskLevel || (siteExp ? siteExp.riskLevel : 'low');
    
    // User-friendly time format (e.g. 2:15 PM)
    let formattedTime = '';
    if (evt.timestamp) {
      try {
        formattedTime = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        formattedTime = '';
      }
    }

    // Short risk label (LOW, MED, HIGH)
    const riskLabel = risk === 'medium' ? 'MED' : risk.toUpperCase();

    item.innerHTML = `
      <div>
        <strong style="color: #1e293b;">${normalizedDom}</strong>
        <span style="font-size: 10px; color: #94a3b8; margin-left: 6px;">${formattedTime}</span>
      </div>
      <span class="risk-pill risk-${risk}" style="font-size: 9px; padding: 1px 6px;">${riskLabel}</span>
    `;

    listEl.appendChild(item);
  });
}
