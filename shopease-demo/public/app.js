// ShopEase E-Commerce Demo Site Logic for PrivacyLens Live Testing

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('shopease-signup-form');

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
      const successCard = document.getElementById('signup-success-card');
      if (successCard) {
        successCard.classList.remove('hidden');
      }
    });
  }
});

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

// Direct API Revocation Simulation on ShopEase Partner Server
async function testDirectRevoke() {
  showToast('⚡ Executing Tier 1 Partner Direct Revocation...');
  try {
    const response = await fetch('/api/partner/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'usr_12345',
        userEmail: 'joshua@example.com',
        targetConsent: 'Marketing Emails'
      })
    });

    const result = await response.json();

    if (result.success) {
      const marketingBadge = document.getElementById('status-marketing');
      if (marketingBadge) {
        marketingBadge.textContent = 'REVOKED (Tier 1 Direct API)';
        marketingBadge.className = 'status-badge revoked';
      }
      showToast(`✅ ${result.message}`);
    } else {
      showToast('❌ Revocation failed: ' + result.message);
    }
  } catch (error) {
    showToast('❌ Partner API error: ' + error.message);
  }
}
