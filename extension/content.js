  let _automaticOverlayTimer = null;

  /**
   * Automatically triggers/refreshes the in-page Shadow DOM overlay and starts/resets the 30-second timer.
   */
  async function triggerAutomaticOverlay(force = false) {
    const domain = overlayNormalizeDomain(window.location.hostname);
    if (!domain || domain === 'unknown' || isExcludedPage()) {
      return;
    }

    // Do NOT re-trigger overlay or restart timer if overlay is already active for the same domain
    const existingHost = document.getElementById(OVERLAY_HOST_ID);
    if (!force && _lastOverlayDomain === domain && existingHost && _automaticOverlayTimer) {
      return;
    }

    const risk = evaluateWebsiteRisk();
    const isHigh = risk.riskLevel === 'High';

    try {
      if (!isExtensionContextValid()) return;
      const storage = await chrome.storage.local.get(['shownPopups', 'lastPopupTriggeredAt']);
      const shownPopups = storage.shownPopups || {};
      const lastTriggered = storage.lastPopupTriggeredAt || 0;
      const now = Date.now();

      // Debounce multiple tabs restoration
      if (!force && now - lastTriggered < 3000) {
        return;
      }

      if (!isHigh) {
        // LOW or MEDIUM risk: only show popup on the first visit ever
        if (!force && shownPopups[domain]) {
          console.log(`[RECLAIM] Skipping repeat popup for Low/Medium risk domain: ${domain}`);
          return;
        }
        shownPopups[domain] = {
          shownCount: 1,
          firstShownAt: new Date().toISOString(),
          lastShownAt: new Date().toISOString()
        };
        await chrome.storage.local.set({
          shownPopups,
          lastPopupTriggeredAt: now
        });
      } else {
        // HIGH risk: show popup on every meaningful visit
        await chrome.storage.local.set({
          lastPopupTriggeredAt: now
        });
      }
    } catch (e) {
      if (!force && isDismissed(domain)) return;
    }

    _lastOverlayDomain = domain;

    injectOverlay();

    const host = document.getElementById(OVERLAY_HOST_ID);
    if (host) {
      host.style.display = 'block';
    }

    refreshOverlayUI();

    if (!_automaticOverlayTimer) {
      _automaticOverlayTimer = setTimeout(() => {
        hideAutomaticOverlay();
      }, 30000);
    }
  }
