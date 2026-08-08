// content.js - RECLAIM Privacy Exposure Interceptor, Website Visit Monitor & Auto-Show Overlay
// Privacy-by-Design: Extracts ONLY metadata categories. Never harvests values, passwords, or PII.

// ============================================================
// SECTION 1: Form Interception (Existing - Unchanged)
// ============================================================

// Explicitly forbidden input types, names, and autocomplete attributes for security
const SENSITIVE_TYPES = ['password', 'hidden', 'file'];
const SENSITIVE_KEYWORDS = [
  'password', 'pass', 'pwd', 'secret', 'token', 'auth', 
  'card', 'cc', 'creditcard', 'cvv', 'cvc', 'exp', 'account',
  'otp', 'pin', 'ssn', 'tax', 'social'
];

/**
 * Checks if an input field is sensitive and MUST be ignored for privacy/security reasons.
 */
function isSensitiveField(input) {
  const type = (input.type || '').toLowerCase();
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const autocomplete = (input.autocomplete || '').toLowerCase();
  
  if (SENSITIVE_TYPES.includes(type)) return true;
  
  const isMatch = (str) => SENSITIVE_KEYWORDS.some(keyword => str.includes(keyword));
  
  if (isMatch(name) || isMatch(id) || isMatch(autocomplete)) return true;
  
  return false;
}

/**
 * Normalizes hostname (e.g. www.sub.example.com -> example.com)
 */
function normalizeDomain(hostname) {
  if (!hostname) return 'unknown';
  let domain = hostname.toLowerCase().trim();
  // Strip port if present
  domain = domain.split(':')[0];
  // Remove leading www.
  if (domain.startsWith('www.')) {
    domain = domain.substring(4);
  }
  return domain;
}

/**
 * Detects abstract data categories from form inputs without reading or storing any values.
 */
function detectDataCategories(inputs) {
  const categories = new Set();
  
  inputs.forEach(input => {
    if (isSensitiveField(input)) return; // Explicit security barrier
    if (input.type === 'checkbox' || input.type === 'radio' || input.type === 'submit' || input.type === 'button') return;

    const type = (input.type || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const searchStr = `${name} ${id} ${placeholder}`;

    // Email detection
    if (type === 'email' || searchStr.includes('email') || searchStr.includes('mail')) {
      categories.add('email');
    }

    // Phone detection
    if (type === 'tel' || searchStr.includes('phone') || searchStr.includes('mobile') || searchStr.includes('tel')) {
      categories.add('phone');
    }

    // Name detection
    if (searchStr.includes('name') || searchStr.includes('fname') || searchStr.includes('lname') || searchStr.includes('first') || searchStr.includes('last')) {
      categories.add('name');
    }
  });

  return Array.from(categories);
}

/**
 * Detects consent categories from checkboxes without reading personal choices or values.
 */
function detectConsentCategories(inputs) {
  const consents = new Set();

  inputs.forEach(input => {
    if (input.type !== 'checkbox') return;

    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();

    // Look for associated label text
    let labelText = '';
    if (input.labels && input.labels.length > 0) {
      labelText = input.labels[0].innerText.toLowerCase();
    } else if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) labelText = label.innerText.toLowerCase();
    }

    const parentText = (input.parentElement ? input.parentElement.innerText : '').toLowerCase();
    const fullText = `${name} ${id} ${labelText} ${parentText}`;

    if (fullText.includes('marketing') || fullText.includes('promotional') || fullText.includes('offer')) {
      consents.add('marketing');
    }
    if (fullText.includes('newsletter') || fullText.includes('updates')) {
      consents.add('promotional');
    }
    if (fullText.includes('terms') || fullText.includes('condition') || fullText.includes('agree') || fullText.includes('policy')) {
      consents.add('terms');
    }
  });

  return Array.from(consents);
}

/**
 * Scans page DOM for behavioral tracking & targeted advertising indicators (§9)
 */
function detectBehavioralTracking() {
  const trackerKeywords = [
    'google-analytics', 'googletagmanager', 'doubleclick', 'googlesyndication',
    'fbevents.js', 'facebook.net/en_us/fbevents', 'connect.facebook.net',
    'criteo', 'taboola', 'outbrain', 'hotjar', 'clarity.ms', 'adroll',
    'pixel', 'telemetry', 'analytics', 'remarketing', 'targeted-ad', 'behavioral'
  ];
  let detected = false;
  const reasons = [];

  const scripts = Array.from(document.querySelectorAll('script'));
  scripts.forEach(script => {
    const src = (script.src || '').toLowerCase();
    const content = (script.textContent || '').toLowerCase();
    trackerKeywords.forEach(keyword => {
      if (src.includes(keyword) || content.includes(keyword)) {
        detected = true;
        reasons.push(`Tracker script detected (${keyword})`);
      }
    });
  });

  const iframes = Array.from(document.querySelectorAll('iframe'));
  iframes.forEach(iframe => {
    const src = (iframe.src || '').toLowerCase();
    if (src.includes('doubleclick') || src.includes('googlesyndication') || src.includes('adnxs') || src.includes('rubiconproject')) {
      detected = true;
      reasons.push('Targeted ad network iframe detected');
    }
  });

  return {
    hasBehavioralTracking: detected,
    reasons: Array.from(new Set(reasons))
  };
}

/**
 * Detects if a form is a registration / signup form (as opposed to a login form).
 * Uses ONLY safe DOM metadata (button labels, headings, form attributes).
 * NEVER reads input values, passwords, or PII.
 */
function isRegistrationForm(form) {
  if (!form) return false;

  const action = (form.action || '').toLowerCase();
  const id = (form.id || '').toLowerCase();
  const className = (form.className || '').toLowerCase();
  
  // Check buttons
  const buttons = Array.from(form.querySelectorAll('button, input[type="submit"], input[type="button"]'));
  const buttonText = buttons.map(b => (b.innerText || b.value || '').toLowerCase()).join(' ');

  // Form inner text summary (top 300 chars only)
  const formSummary = (form.innerText || '').substring(0, 300).toLowerCase();

  const fullStr = `${action} ${id} ${className} ${buttonText} ${formSummary}`;

  // Explicit login-only check (e.g. Sign in, Log in without signup keywords)
  const isLoginPattern = (fullStr.includes('login') || fullStr.includes('log in') || fullStr.includes('signin') || fullStr.includes('sign in')) &&
                         !(fullStr.includes('signup') || fullStr.includes('sign up') || fullStr.includes('register') || fullStr.includes('create account') || fullStr.includes('create your account') || fullStr.includes('join'));

  if (isLoginPattern) return false;

  // Registration keywords
  const regKeywords = [
    'signup', 'sign up', 'sign-up', 'register', 'registration',
    'create account', 'create your account', 'create-account',
    'join now', 'get started', 'new account', 'register.php', 'signup.html'
  ];

  const hasRegKeyword = regKeywords.some(kw => fullStr.includes(kw));

  // Input attributes check (confirm password, terms, first_name)
  const inputs = Array.from(form.querySelectorAll('input'));
  const inputAttributes = inputs.map(i => `${i.name || ''} ${i.id || ''} ${i.placeholder || ''}`.toLowerCase()).join(' ');
  const hasRegInputs = inputAttributes.includes('confirm') || inputAttributes.includes('first_name') || inputAttributes.includes('last_name') || inputAttributes.includes('terms') || inputAttributes.includes('agree');

  return hasRegKeyword || hasRegInputs;
}

/**
 * Checks for successful registration confirmation signals (URL path or DOM confirmation message).
 */
function checkForRegistrationConfirmation() {
  try {
    const rawPending = sessionStorage.getItem('reclaim_pending_registration');
    if (!rawPending) return;

    const pending = JSON.parse(rawPending);
    const now = Date.now();

    // Expire pending registration after 2 minutes
    if (now - pending.timestamp > 120000) {
      sessionStorage.removeItem('reclaim_pending_registration');
      return;
    }

    const domain = normalizeDomain(window.location.hostname);
    if (domain !== pending.domain) return;

    // Check 1: Confirmation URL paths
    const href = window.location.href.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const isConfirmationUrl = [
      '/welcome', '/dashboard', '/account-created', '/signup-success',
      '/verify-email', '/confirm', '/getting-started', '/onboarding',
      '/home', '/success', '/account', '/registered'
    ].some(p => path.includes(p) || href.includes(p));

    // Check 2: DOM confirmation messages
    const bodyText = (document.body ? document.body.innerText || '' : '').toLowerCase().substring(0, 2000);
    const isConfirmationText = [
      'account created', 'registration successful', 'welcome to',
      'check your email', 'verification link', 'verification email sent',
      'account setup complete', 'successfully registered', 'welcome aboard',
      'thanks for registering', 'thanks for signing up', 'thank you for signing up',
      'account has been created', 'your account is ready'
    ].some(kw => bodyText.includes(kw));

    // Check 3: Post-submit navigation (different page or clean redirect after submission)
    const isPostSubmitNav = (document.referrer && document.referrer !== window.location.href && !href.includes('signup') && !href.includes('register'));

    if (isConfirmationUrl || isConfirmationText || isPostSubmitNav) {
      // Clear pending token so it fires ONLY ONCE
      sessionStorage.removeItem('reclaim_pending_registration');

      const sessionConfirmedKey = 'reclaim_confirmed_reg_' + pending.eventId;
      if (sessionStorage.getItem(sessionConfirmedKey)) return;
      sessionStorage.setItem(sessionConfirmedKey, '1');

      // Send ACCOUNT_CREATED event to service worker
      chrome.runtime.sendMessage({
        type: 'ACCOUNT_CREATED',
        domain: domain,
        eventId: pending.eventId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        confirmationSignal: isConfirmationText ? 'DOM_TEXT' : (isConfirmationUrl ? 'URL_PATH' : 'NAVIGATION')
      }).catch(() => {});
    }
  } catch (err) {}
}

/**
 * Intercepts form submission and sends sanitized exposure metadata only.
 */
function handleFormSubmit(form) {
  const inputs = Array.from(form.querySelectorAll('input, select, textarea'));

  const dataTypes = detectDataCategories(inputs);
  const consents = detectConsentCategories(inputs);

  // Registration flow detection - sets pending token if registration form
  if (isRegistrationForm(form)) {
    const regToken = {
      domain: normalizeDomain(window.location.hostname),
      timestamp: Date.now(),
      eventId: 'reg_' + Math.random().toString(36).substring(2, 11)
    };
    try {
      sessionStorage.setItem('reclaim_pending_registration', JSON.stringify(regToken));
    } catch (e) {}
  }

  // Send payload only if relevant exposure data types or consents were detected
  if (dataTypes.length > 0 || consents.length > 0) {
    const domain = normalizeDomain(window.location.hostname);
    
    chrome.storage.local.get(['childSafeMode'], (res) => {
      const isChildSafe = res.childSafeMode || false;
      const tracking = detectBehavioralTracking();

      // Privacy-preserving metadata payload - NO PII, values, or credentials included!
      const payload = {
        type: 'FORM_SUBMISSION',
        domain: domain,
        dataTypes: dataTypes,
        consents: consents,
        eventType: 'FORM_SUBMISSION',
        timestamp: new Date().toISOString(),
        eventId: 'evt_' + Math.random().toString(36).substring(2, 11),
        childSafeMode: isChildSafe,
        behavioralTracking: tracking
      };

      chrome.runtime.sendMessage(payload).catch(() => {
        // Ignore errors when extension context is invalidated
      });
    });
  }
}

// Debounce map to avoid duplicate event triggers per form within 2 seconds
const lastSubmissionTimes = new WeakMap();

document.addEventListener('submit', (e) => {
  const form = e.target;
  if (form && form.tagName === 'FORM') {
    const now = Date.now();
    const lastTime = lastSubmissionTimes.get(form) || 0;
    if (now - lastTime > 2000) {
      lastSubmissionTimes.set(form, now);
      handleFormSubmit(form);
    }
  }
}, true);

// Check for registration confirmation on load and SPA navigation
checkForRegistrationConfirmation();
window.addEventListener('load', checkForRegistrationConfirmation);

// Passively notify background script of website page navigation (for Recent Website Activity tracking)
if (window.location.protocol.startsWith('http')) {
  const currentDomain = normalizeDomain(window.location.hostname);
  if (currentDomain && currentDomain !== 'unknown') {
    chrome.storage.local.get(['childSafeMode'], (res) => {
      chrome.runtime.sendMessage({
        type: 'PAGE_VISIT',
        domain: currentDomain,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        childSafeMode: res.childSafeMode || false,
        behavioralTracking: detectBehavioralTracking()
      }).catch(() => {});
    });
  }
}
// Message bus listener for DOM tracking queries
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'CHECK_BEHAVIORAL_TRACKING') {
    sendResponse(detectBehavioralTracking());
    return true;
  }
});


// ============================================================
// SECTION 2: Auto-Show PrivacyLens Overlay
// Injects the EXACT same UI from popup.html + popup.js into every page
// ============================================================

(function initReclaimOverlay() {
  'use strict';

  const OVERLAY_HOST_ID = 'reclaim-privacy-overlay-host';
  const DISMISS_KEY_PREFIX = 'reclaim_dismissed_';
  const MAX_RECENT_VISITS_DISPLAY = 5;

  // Guard: don't run on non-HTTP pages
  if (!window.location.protocol.startsWith('http')) return;

  /**
   * Returns true for pages where the overlay should NOT appear:
   * - New/empty tabs (about:blank, chrome://newtab, etc.)
   * - Google.com and all Google subdomains (search, maps, mail, etc.)
   */
  function isExcludedPage() {
    const href = window.location.href.toLowerCase();
    if (href === 'about:blank' || href === 'about:newtab' || href === 'chrome://newtab/') return true;

    const domain = overlayNormalizeDomain(window.location.hostname);
    // Exclude google.com and all subdomains (mail.google.com, maps.google.com, etc.)
    if (domain === 'google.com' || domain.endsWith('.google.com')) return true;
    // Also exclude regional Google domains (google.co.in, google.co.uk, etc.)
    if (/^google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(domain) || /\.google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(domain)) return true;

    return false;
  }

  // Track current URL for SPA detection
  let _lastOverlayUrl = window.location.href;

  // We store a reference to the shadow root since mode:'closed' doesn't expose it
  let _shadowRef = null;

  /**
   * Check if overlay was dismissed for this domain in this tab session
   */
  function isDismissed(domain) {
    try {
      return sessionStorage.getItem(DISMISS_KEY_PREFIX + domain) === '1';
    } catch (e) {
      return false;
    }
  }

  /**
   * Mark overlay as dismissed for this domain in this tab session
   */
  function setDismissed(domain) {
    try {
      sessionStorage.setItem(DISMISS_KEY_PREFIX + domain, '1');
    } catch (e) {}
  }

  // -------------------------------------------------------
  // CSS: Exact copy of popup.html <style> block, scoped inside Shadow DOM
  // -------------------------------------------------------
  const POPUP_CSS = `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .reclaim-overlay-wrapper {
      width: 340px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10);
      border: 1px solid #e2e8f0;
      animation: reclaim-slide-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      line-height: 1.4;
    }

    @keyframes reclaim-slide-in {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* --- Header --- */
    .header {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      color: #ffffff;
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .brand-icon { color: #38bdf8; }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .score-badge {
      background: rgba(255, 255, 255, 0.1);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }
    .close-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: #ffffff;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      line-height: 1;
    }
    .close-btn:hover { background: rgba(255, 255, 255, 0.3); }

    /* --- Container & Cards --- */
    .container { padding: 12px; }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* --- Current Site --- */
    .current-domain {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      word-break: break-all;
    }
    .status-banner {
      margin-top: 6px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge-container {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 8px;
    }
    .chip {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 4px;
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 500;
    }
    .chip-consent {
      background-color: #e0f2fe;
      color: #0369a1;
    }

    /* --- Risk Pills --- */
    .risk-pill {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
    }
    .risk-low    { background: #dcfce7; color: #166534; }
    .risk-medium { background: #fef9c3; color: #854d0e; }
    .risk-high   { background: #fee2e2; color: #991b1b; }

    /* --- Stats Grid --- */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      text-align: center;
    }
    .summary-stat {
      background: #f8fafc;
      padding: 8px 4px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .stat-number {
      font-size: 16px;
      font-weight: 800;
      color: #2563eb;
    }
    .stat-label {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }

    /* --- Dashboard Button --- */
    .btn-dashboard {
      display: block;
      width: 100%;
      background: #2563eb;
      color: white;
      text-align: center;
      padding: 9px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      border: none;
      cursor: pointer;
      margin-top: 6px;
      transition: background 0.2s;
    }
    .btn-dashboard:hover { background: #1d4ed8; }

    /* --- Recent Activity List --- */
    .recent-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .recent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
    }
    .recent-item:last-child { border-bottom: none; }

    /* --- Footer --- */
    .privacy-note {
      font-size: 11px;
      color: #64748b;
      background: #f1f5f9;
      padding: 8px 12px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      line-height: 1.4;
    }

    .alert-chip-child {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 10px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
    }
  `;

  // -------------------------------------------------------
  // HTML: Exact copy of popup.html <body> structure
  // -------------------------------------------------------
  const POPUP_HTML = `
    <div class="reclaim-overlay-wrapper">

      <div class="header">
        <div class="brand">
          <span class="brand-icon">🛡️</span> RECLAIM
        </div>
        <div class="header-right">
          <div class="score-badge" id="privacy-score-badge">Score: 100/100</div>
          <button class="close-btn" id="reclaim-close-btn" title="Dismiss">✕</button>
        </div>
      </div>

      <div class="container">
        <!-- Current Site Exposure -->
        <div class="card">
          <div class="card-title">
            <span>Current Site</span>
            <span id="site-risk-pill" class="risk-pill risk-low">CLEAN</span>
          </div>
          <div class="current-domain" id="current-domain">Detecting...</div>
          <div class="status-banner" id="exposure-status">
            Checking domain exposure...
          </div>
          <div class="badge-container" id="detected-badges">
            <!-- Dynamic Category Chips -->
          </div>
          <div id="child-safe-alert-container"></div>
        </div>

        <!-- Digital Exposure Metrics -->
        <div class="card">
          <div class="card-title">Digital Exposure Overview</div>
          <div class="summary-grid">
            <div class="summary-stat">
              <div class="stat-number" id="stat-websites">0</div>
              <div class="stat-label">Websites</div>
            </div>
            <div class="summary-stat">
              <div class="stat-number" id="stat-accounts">0</div>
              <div class="stat-label">Exposures</div>
            </div>
            <div class="summary-stat">
              <div class="stat-number" id="stat-high-risk" style="color: #dc2626;">0</div>
              <div class="stat-label">High Risk</div>
            </div>
          </div>
          <button id="btn-open-dashboard" class="btn-dashboard">Open Privacy Dashboard</button>
        </div>

        <!-- Recent Website Activity -->
        <div class="card">
          <div class="card-title">Recent Website Activity</div>
          <div class="recent-list" id="recent-exposure-list">
            <div style="font-size: 12px; color: #94a3b8; text-align: center; padding: 6px 0;">No recent website activity.</div>
          </div>
        </div>
      </div>

      <div class="privacy-note">
        🔒 Reclaim never collects passwords, OTPs, or payment credentials.
      </div>

    </div>
  `;

  // -------------------------------------------------------
  // Helpers: Exact copies from popup.js
  // -------------------------------------------------------

  function overlayNormalizeDomain(hostname) {
    if (!hostname) return '';
    let domain = hostname.toLowerCase().trim().split(':')[0];
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
    return domain;
  }

  function isInternalUrl(urlOrDomain) {
    if (!urlOrDomain) return true;
    const lower = urlOrDomain.toLowerCase().trim();
    const internalPrefixes = [
      'chrome://', 'chrome-extension://', 'edge://', 'about:',
      'devtools://', 'file://', 'blob:', 'data:', 'view-source:'
    ];
    return internalPrefixes.some(prefix => lower.startsWith(prefix)) || lower === 'unknown' || lower === 'newtab';
  }

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

  // -------------------------------------------------------
  // Render functions: Exact copies from popup.js
  // (adapted to query elements from shadow root instead of document)
  // -------------------------------------------------------

  function renderCurrentSite(shadow, activeTabState, siteExposure) {
    const domainEl = shadow.getElementById('current-domain');
    const statusEl = shadow.getElementById('exposure-status');
    const riskPill = shadow.getElementById('site-risk-pill');
    const badgesContainer = shadow.getElementById('detected-badges');
    if (!domainEl || !statusEl || !riskPill || !badgesContainer) return;

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

  function renderExposureOverview(shadow, exposures, storageData) {
    const records = Object.values(exposures || {});

    const visitedWebsites = (storageData && storageData.visitedWebsites) || [];
    const totalWebsites = (storageData && typeof storageData.webCount === 'number')
      ? storageData.webCount
      : (visitedWebsites.length || Object.keys(exposures || {}).length);

    const exposureCount = (storageData && typeof storageData.exposureCount === 'number')
      ? storageData.exposureCount
      : records.reduce((acc, r) => acc + (r.eventCount || 1), 0);
    const highRiskCount = records.filter(r => r.riskLevel === 'high').length;

    const statWebsites = shadow.getElementById('stat-websites');
    const statAccounts = shadow.getElementById('stat-accounts');
    const statHighRisk = shadow.getElementById('stat-high-risk');
    const scoreBadge = shadow.getElementById('privacy-score-badge');

    if (statWebsites) statWebsites.textContent = totalWebsites;
    if (statAccounts) statAccounts.textContent = exposureCount;
    if (statHighRisk) statHighRisk.textContent = highRiskCount;

    // Calculate and update score
    const score = calculatePrivacyScore(exposures);
    if (scoreBadge) {
      scoreBadge.textContent = `Score: ${score}/100`;
      if (score < 50) scoreBadge.style.borderColor = '#ef4444';
      else if (score < 75) scoreBadge.style.borderColor = '#f59e0b';
      else scoreBadge.style.borderColor = '#10b981';
    }
  }

  function renderRecentVisits(shadow, visits) {
    const listEl = shadow.getElementById('recent-exposure-list');
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

      const normalizedDom = overlayNormalizeDomain(v.domain);

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

  // -------------------------------------------------------
  // Main refresh: Exact copy of popup.js refreshUI()
  // (adapted: uses window.location instead of chrome.tabs.query)
  // -------------------------------------------------------

  function refreshOverlayUI() {
    if (!_shadowRef) return;

    chrome.runtime.sendMessage({ type: 'GET_EXTENSION_STATE', domain: overlayNormalizeDomain(window.location.hostname) }, (response) => {
      if (chrome.runtime.lastError || !_shadowRef) return;

      const siteData = response || {};
      const allExposures = siteData.exposures || {};
      const isDemo = siteData.demoMode || false;

      let visits = siteData.recentWebsiteVisits || [];
      if (!isDemo) {
        visits = visits.filter(v => !v.isDemo);
      }

        // Active Tab State Machine — using window.location (content script knows the page)
        const activeTabState = {
          status: 'success',
          domain: overlayNormalizeDomain(window.location.hostname),
          title: document.title || window.location.hostname,
          url: window.location.href,
          protocol: window.location.protocol.replace(':', '').toUpperCase()
        };

        if (isInternalUrl(window.location.href)) {
          activeTabState.status = 'unsupported-page';
        }

        const isChildSafe = siteData.childSafeMode || false;
        const currentExp = allExposures[activeTabState.domain] || null;
        let hasBehavioralTracking = detectBehavioralTracking().hasBehavioralTracking;
        if (currentExp && (currentExp.consentTypes || []).some(c => c === 'marketing' || c === 'promotional')) {
          hasBehavioralTracking = true;
        }

        // Render Current Active Site Card
        renderCurrentSite(_shadowRef, activeTabState, currentExp);

        // Render Child Safe Alert (§9)
        const alertContainer = _shadowRef.getElementById('child-safe-alert-container');
        if (alertContainer) {
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

        // Render Overall Overview Metrics & Privacy Score
        renderExposureOverview(_shadowRef, allExposures, siteData);

        // Render Recent Website Activity List
        renderRecentVisits(_shadowRef, visits);

        // Bridge extension data to host page DOM for Dashboard UI synchronization (Extension = Single Source of Truth)
        if (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) {
          const syncPayload = {
            type: 'RECLAIM_EXTENSION_SYNC',
            eventId: 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            timestamp: new Date().toISOString(),
            webCount: siteData.webCount || 0,
            exposureCount: siteData.exposureCount || 0,
            visitedWebsites: siteData.visitedWebsites || [],
            exposures: siteData.exposures || {},
            recentWebsiteVisits: visits || [],
            privacyScore: calculatePrivacyScore(siteData.exposures),
            childSafeMode: isChildSafe,
            isExtensionActive: true
          };
          try {
            window.postMessage(syncPayload, '*');
            window.localStorage.setItem('reclaim_extension_sync', JSON.stringify(syncPayload));
            window.dispatchEvent(new CustomEvent('reclaim_extension_sync_event', { detail: syncPayload }));
          } catch (e) {}
        }
    });
  }

  // Listen for explicit Dashboard sync requests
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'REQUEST_EXTENSION_SYNC') {
      refreshOverlayUI();
    }
  });

  // -------------------------------------------------------
  // Overlay injection
  // -------------------------------------------------------

  function injectOverlay() {
    const domain = overlayNormalizeDomain(window.location.hostname);
    if (!domain || domain === 'unknown') return;
    if (isExcludedPage()) return;
    if (isDismissed(domain)) return;

    // Prevent duplicates
    if (document.getElementById(OVERLAY_HOST_ID)) return;

    // Create host element with fixed positioning
    const host = document.createElement('div');
    host.id = OVERLAY_HOST_ID;
    host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; bottom: 16px; right: 16px;';

    // Attach closed Shadow DOM for full CSS isolation
    const shadow = host.attachShadow({ mode: 'closed' });
    _shadowRef = shadow;

    // Inject styles
    const style = document.createElement('style');
    style.textContent = POPUP_CSS;
    shadow.appendChild(style);

    // Inject HTML
    const wrapper = document.createElement('div');
    wrapper.innerHTML = POPUP_HTML;
    shadow.appendChild(wrapper);

    // Attach to page
    document.body.appendChild(host);

    // --- Wire up event listeners ---

    // Close button
    const closeBtn = shadow.getElementById('reclaim-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        setDismissed(domain);
        const hostEl = document.getElementById(OVERLAY_HOST_ID);
        if (hostEl) hostEl.remove();
        _shadowRef = null;
      });
    }

    // Dashboard button — opens dashboard in new tab
    const dashboardBtn = shadow.getElementById('btn-open-dashboard');
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' }).catch(() => {});
        window.open('http://localhost:5173', '_blank');
      });
    }

    // Initial data load
    refreshOverlayUI();
  }

  function removeOverlay() {
    const existing = document.getElementById(OVERLAY_HOST_ID);
    if (existing) existing.remove();
    _shadowRef = null;
  }

  // -------------------------------------------------------
  // SPA Navigation Detection
  // -------------------------------------------------------

  function handleUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl === _lastOverlayUrl) return;
    _lastOverlayUrl = currentUrl;

    // Remove existing overlay (domain may have changed)
    removeOverlay();

    // Re-inject for new URL after a brief settling delay
    setTimeout(() => injectOverlay(), 300);
  }

  // popstate (back/forward)
  window.addEventListener('popstate', handleUrlChange);

  // hashchange
  window.addEventListener('hashchange', handleUrlChange);

  // Intercept pushState / replaceState for SPA frameworks
  const _origPushState = history.pushState;
  const _origReplaceState = history.replaceState;

  history.pushState = function () {
    _origPushState.apply(this, arguments);
    handleUrlChange();
  };

  history.replaceState = function () {
    _origReplaceState.apply(this, arguments);
    handleUrlChange();
  };

  // Fallback URL poller (some SPAs manipulate URL without standard APIs)
  setInterval(() => {
    if (window.location.href !== _lastOverlayUrl) {
      handleUrlChange();
    }
  }, 1500);

  // -------------------------------------------------------
  // Listen for live data updates from background
  // -------------------------------------------------------
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'OVERLAY_DATA_UPDATE') {
      refreshOverlayUI();
    } else if (message && message.type === 'GET_DOM_METADATA') {
      try {
        const metaDesc = document.querySelector('meta[name="description"]')?.content || 
                         document.querySelector('meta[property="og:description"]')?.content || 
                         document.querySelector('meta[property="twitter:description"]')?.content || '';
        
        const headings = Array.from(document.querySelectorAll('h1, h2'))
          .slice(0, 3)
          .map(h => h.innerText.trim())
          .filter(t => t.length > 0);
          
        sendResponse({
          title: document.title || '',
          metaDescription: metaDesc || '',
          headings: headings || []
        });
      } catch (err) {
        sendResponse({ title: document.title || '', metaDescription: '', headings: [] });
      }
      return true;
    }
  });

  // -------------------------------------------------------
  // Initial display
  // -------------------------------------------------------
  if (document.readyState === 'complete') {
    setTimeout(injectOverlay, 400);
  } else {
    window.addEventListener('load', () => {
      setTimeout(injectOverlay, 400);
    });
  }

})();

// --- SHARED AUTHENTICATION SYNC WITH WEB DASHBOARD ---
function checkIsDashboard() {
  return window.location.port === '5173' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         (document.title && document.title.includes('PrivacyLens'));
}

// Listen for active queries from page (registered unconditionally)
window.addEventListener('message', async (event) => {
  const message = event.data;
  if (message && message.direction === 'from-page') {
    console.log('[RECLAIM Content Script] Received message from page:', message);
    if (!checkIsDashboard()) {
      console.log('[RECLAIM Content Script] checkIsDashboard failed for:', window.location.href);
      return;
    }

    if (message.type === 'GetExtensionSession') {
      try {
        const data = await chrome.storage.local.get(['session']);
        console.log('[RECLAIM Content Script] Sending ExtensionSessionResponse:', data.session);
        window.postMessage({
          direction: 'from-content-script',
          type: 'ExtensionSessionResponse',
          detail: data.session || null
        }, '*');
      } catch (err) {
        console.error('Failed to get session from extension:', err);
      }
    } else if (message.type === 'SetExtensionSession') {
      try {
        if (message.detail) {
          console.log('[RECLAIM Content Script] Saving session to storage:', message.detail);
          await chrome.storage.local.set({ session: message.detail });
        }
      } catch (err) {
        console.error('Failed to save session in extension:', err);
      }
    } else if (message.type === 'ClearExtensionSession') {
      try {
        console.log('[RECLAIM Content Script] Clearing session from storage');
        await chrome.storage.local.remove(['session']);
      } catch (err) {
        console.error('Failed to clear session in extension:', err);
      }
    } else if (message.type === 'PingExtension') {
      console.log('[RECLAIM Content Script] Received PingExtension, replying with PongExtension...');
      window.postMessage({
        direction: 'from-content-script',
        type: 'PongExtension'
      }, '*');
    }
  }
});

// Startup Broadcast: Immediately push current session state to avoid race conditions
(async () => {
  if (!checkIsDashboard()) return;
  try {
    const data = await chrome.storage.local.get(['session']);
    window.postMessage({
      direction: 'from-content-script',
      type: 'ExtensionSessionResponse',
      detail: data.session || null
    }, '*');
  } catch (err) {
    console.error('Failed to broadcast initial session on load:', err);
  }
})();

