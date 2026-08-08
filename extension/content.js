// content.js - RECLAIM Privacy Exposure Interceptor
// Privacy-by-Design: Extracts ONLY metadata categories. Never harvests values, passwords, or PII.

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
 * Intercepts form submission and sends sanitized exposure metadata only.
 */
function handleFormSubmit(form) {
  const inputs = Array.from(form.querySelectorAll('input, select, textarea'));

  const dataTypes = detectDataCategories(inputs);
  const consents = detectConsentCategories(inputs);

  // Send payload only if relevant exposure data types or consents were detected
  if (dataTypes.length > 0 || consents.length > 0) {
    const domain = normalizeDomain(window.location.hostname);
    
    // Privacy-preserving metadata payload - NO PII, values, or credentials included!
    const payload = {
      type: 'FORM_SUBMISSION',
      domain: domain,
      dataTypes: dataTypes,
      consents: consents,
      eventType: 'FORM_SUBMISSION',
      timestamp: new Date().toISOString(),
      eventId: 'evt_' + Math.random().toString(36).substring(2, 11)
    };

    chrome.runtime.sendMessage(payload).catch(() => {
      // Ignore errors when extension context is invalidated
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
