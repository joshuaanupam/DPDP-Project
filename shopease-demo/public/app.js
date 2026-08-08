// ShopEase E-Commerce Demo Site Logic for PrivacyLens Live Testing

let pollingInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('shopease-signup-form');
  const successCard = document.getElementById('signup-success-card');

  // Check if user is already signed up in local session
  const persistedEmail = localStorage.getItem('shopease_email');
  if (persistedEmail) {
    if (signupForm) signupForm.classList.add('hidden');
    if (successCard) successCard.classList.remove('hidden');
    startStatusPolling(persistedEmail);
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const termsGranted = document.getElementById('consent-terms').checked;
      const marketingGranted = document.getElementById('consent-marketing').checked;
      const thirdPartyGranted = document.getElementById('consent-thirdparty').checked;

      showToast('🎉 Account creation submitted to ShopEase!');

      // Save email to localStorage for session persistence
      localStorage.setItem('shopease_email', email);

      // Send event to PrivacyLens Backend API (http://localhost:5000/api/events)
      try {
        const payload = {
          userId: 'usr_12345',
          domain: 'shopease.com',
          siteName: 'ShopEase',
          detectedFields: ['Email', 'Phone', 'Name'],
          consents: [
            { consentType: 'Account Creation', granted: termsGranted },
            { consentType: 'Marketing Emails', granted: marketingGranted },
            { consentType: '3rd-Party Ads', granted: thirdPartyGranted }
          ],
          timestamp: new Date().toISOString()
        };

        const res = await fetch('http://localhost:5000/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          showToast(`🛡️ PrivacyLens recorded event! Score: ${data.updatedPrivacyScore}`);
        }
      } catch (err) {
        console.log('PrivacyLens Backend offline or unreachable from client-side fallback:', err.message);
      }

      // Hide form and display success card
      signupForm.classList.add('hidden');
      if (successCard) {
        successCard.classList.remove('hidden');
      }

      startStatusPolling(email);
    });
  }
});

// Real-time polling to check if consent has been revoked on the backend
function startStatusPolling(email) {
  if (pollingInterval) clearInterval(pollingInterval);

  // Poll every 1.5 seconds
  pollingInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/partner/status/${encodeURIComponent(email)}`);
      
      if (res.status === 404) {
        // Account was deleted via Tier 1 Deletion API!
        clearInterval(pollingInterval);
        localStorage.removeItem('shopease_email');
        showToast('🗑️ Your account was deleted from ShopEase databases.');
        setTimeout(() => location.reload(), 2000);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const consents = data.account.consents;

        // Update marketing consent badge
        const marketingBadge = document.getElementById('status-marketing');
        if (marketingBadge) {
          if (consents.marketingEmails) {
            marketingBadge.textContent = 'ACTIVE';
            marketingBadge.className = 'status-badge active';
          } else {
            marketingBadge.textContent = 'REVOKED (Tier 1 Direct API)';
            marketingBadge.className = 'status-badge revoked';
          }
        }

        // Update 3rd party sharing badge
        const thirdPartyBadge = document.getElementById('status-thirdparty');
        if (thirdPartyBadge) {
          if (consents.thirdPartySharing) {
            thirdPartyBadge.textContent = 'ACTIVE';
            thirdPartyBadge.className = 'status-badge active';
          } else {
            thirdPartyBadge.textContent = 'REVOKED (Tier 1 Direct API)';
            thirdPartyBadge.className = 'status-badge revoked';
          }
        }
      }
    } catch (err) {
      console.warn('Polling error:', err.message);
    }
  }, 1500);
}

// Reset the demo manually
function resetDemo() {
  clearInterval(pollingInterval);
  localStorage.removeItem('shopease_email');
  showToast('🔄 Demo state reset successfully.');
  setTimeout(() => location.reload(), 1000);
}

// Privacy Modal Controls
function openPrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  if (modal) modal.classList.remove('hidden');
}

function closePrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  if (modal) modal.classList.add('hidden');
}

// Toast Notification Helper
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>ℹ️</span> <div>${message}</div>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Direct API Revocation Simulation from ShopEase page directly
async function testDirectRevoke() {
  const email = localStorage.getItem('shopease_email') || 'joshua@example.com';
  showToast('⚡ Executing Tier 1 Partner Direct Revocation...');
  try {
    const response = await fetch('/api/partner/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr_12345',
        userEmail: email,
        targetConsent: 'Marketing Emails'
      })
    });

    const result = await response.json();

    if (result.success) {
      showToast(`✅ ${result.message}`);
    } else {
      showToast('❌ Revocation failed: ' + result.message);
    }
  } catch (error) {
    showToast('❌ Partner API error: ' + error.message);
  }
}
