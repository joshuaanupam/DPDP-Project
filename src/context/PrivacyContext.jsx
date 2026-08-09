import React, { createContext, useContext, useState, useMemo } from 'react';
import initialData from '../mocks/mockDashboardData.json';

const PrivacyContext = createContext();

export const PrivacyProvider = ({ children }) => {
  const [userData, setUserData] = useState(initialData.user);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [extensionStatus, setExtensionStatus] = useState('Not Installed');
  const hasDetectedExtension = React.useRef(false);
  const pingTimeoutRef = React.useRef(null);
  const [websites, setWebsites] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [backendActive, setBackendActive] = useState(false);

  // Feature toggles — persisted in localStorage
  const [featureToggles, setFeatureToggles] = useState(() => {
    try {
      const saved = localStorage.getItem('privacylens_feature_toggles');
      return saved ? JSON.parse(saved) : { breachReporter: true, penaltyShield: true };
    } catch { return { breachReporter: true, penaltyShield: true }; }
  });

  const toggleFeature = (key) => {
    setFeatureToggles(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('privacylens_feature_toggles', JSON.stringify(next));
      return next;
    });
  };

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL'); // ALL, High, Medium, Low
  const [tierFilter, setTierFilter] = useState('ALL'); // ALL, 1, 2, 3

  // Modal active states
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'DETAIL', 'TIER1', 'TIER2', 'TIER3'
  const [actionTargetConsent, setActionTargetConsent] = useState(null);

  // Fetch Dashboard Data from Backend
  const fetchDashboardData = async (userId = 'usr_12345') => {
    try {
      const res = await fetch(`http://localhost:5000/api/dashboard/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        setWebsites(data.websites);
        setNominees(data.nominees || []);
        setBreaches(data.breaches || []);
        setBackendActive(true);
      } else {
        // Fallback to mock data if 404/500
        setWebsites(initialData.websites);
        setNominees([]);
        setBreaches([]);
      }
    } catch (err) {
      console.warn("Backend API offline. Using mock dashboard data.");
      setWebsites(initialData.websites);
      setNominees([]);
      setBreaches([]);
    }
  };

  // Fetch Privacy Requests
  const fetchRequests = async (userId = 'usr_12345') => {
    try {
      const res = await fetch(`http://localhost:5000/api/requests/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      } else {
        setRequests(initialData.requests);
      }
    } catch (err) {
      setRequests(initialData.requests);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async (userId = 'usr_12345') => {
    try {
      const res = await fetch(`http://localhost:5000/api/audit/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs);
      } else {
        setAuditLogs(initialData.auditLogs);
      }
    } catch (err) {
      setAuditLogs(initialData.auditLogs);
    }
  };

  // Execute User Login
  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('privacylens_token', data.token);
        setUserData(data.user);
        setIsAuthenticated(true);
        setBackendActive(true);

        window.postMessage({
          direction: 'from-page',
          type: 'SetExtensionSession',
          detail: { token: data.token, user: data.user }
        }, '*');

        await fetchDashboardData(data.user.id);
        await fetchRequests(data.user.id);
        await fetchAuditLogs(data.user.id);
        return { success: true };
      }
      return { success: false, message: data.message || 'Login failed.' };
    } catch (err) {
      return { success: false, message: 'Could not connect to backend authentication server.' };
    }
  };

  // Execute User Registration
  const register = async (name, email, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('privacylens_token', data.token);
        setUserData(data.user);
        setIsAuthenticated(true);
        setBackendActive(true);

        window.postMessage({
          direction: 'from-page',
          type: 'SetExtensionSession',
          detail: { token: data.token, user: data.user }
        }, '*');

        await fetchDashboardData(data.user.id);
        await fetchRequests(data.user.id);
        await fetchAuditLogs(data.user.id);
        return { success: true };
      }
      return { success: false, message: data.message || 'Registration failed.' };
    } catch (err) {
      return { success: false, message: 'Could not connect to backend authentication server.' };
    }
  };

  // Execute User Logout
  const logout = () => {
    localStorage.removeItem('privacylens_token');
    setIsAuthenticated(false);
    setUserData(initialData.user);

    window.postMessage({
      direction: 'from-page',
      type: 'ClearExtensionSession'
    }, '*');
  };

  // Validate session token
  const validateSession = async (token) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/session/${token}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setUserData(data.user);
        setIsAuthenticated(true);
        setBackendActive(true);

        window.postMessage({
          direction: 'from-page',
          type: 'SetExtensionSession',
          detail: { token, user: data.user }
        }, '*');

        await fetchDashboardData(data.user.id);
        await fetchRequests(data.user.id);
        await fetchAuditLogs(data.user.id);
      } else {
        logout();
      }
    } catch (err) {
      console.warn("Auth server offline. Simulating local session validation.");
      setIsAuthenticated(true);

      window.postMessage({
        direction: 'from-page',
        type: 'SetExtensionSession',
        detail: { token, user: userData }
      }, '*');

      await fetchDashboardData();
      await fetchRequests();
      await fetchAuditLogs();
    } finally {
      setAuthLoading(false);
    }
  };

  const [extensionData, setExtensionData] = useState({
    webCount: 0,
    exposureCount: 0,
    visitedWebsites: [],
    exposures: {},
    privacyScore: 100,
    isExtensionSynced: false
  });

  const processedSyncIds = React.useRef(new Set());

  // Restore Authentication Session & Sync Check on Mount
  React.useEffect(() => {
    const token = localStorage.getItem('privacylens_token');

    // Listener for response from extension via postMessage
    const handleAuthMessage = (e) => {
      const message = e.data;
      if (message && message.direction === 'from-content-script') {
        console.log('[PrivacyLens Dashboard] Received auth message from content script:', message);
        if (message.type === 'ExtensionSessionResponse') {
          console.log('[PrivacyLens Dashboard] Extension is Active (received session response)');
          setExtensionStatus('Active');
          hasDetectedExtension.current = true;
          if (pingTimeoutRef.current) {
            clearTimeout(pingTimeoutRef.current);
            pingTimeoutRef.current = null;
          }

          const extensionSession = message.detail;
          if (extensionSession && extensionSession.token) {
            localStorage.setItem('privacylens_token', extensionSession.token);
            validateSession(extensionSession.token);
          } else {
            setAuthLoading(false);
          }
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);

    if (token) {
      validateSession(token);
    } else {
      // Query extension to see if it has a session via postMessage
      window.postMessage({ direction: 'from-page', type: 'GetExtensionSession' }, '*');

      // Fallback timeout to ensure dashboard shows login if extension is offline or no session
      const timer = setTimeout(() => {
        setAuthLoading(false);
      }, 1000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('message', handleAuthMessage);
      };
    }

    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, []);

  // Heartbeat query for MV3 extension status (Installed/Enabled -> Active, Disabled -> Off, Not Installed -> Not Installed)
  React.useEffect(() => {
    const handlePingPong = (e) => {
      const message = e.data;
      if (message && message.direction === 'from-content-script' && message.type === 'PongExtension') {
        console.log('[PrivacyLens Dashboard] Received PongExtension from content script');
        setExtensionStatus('Active');
        hasDetectedExtension.current = true;
        if (pingTimeoutRef.current) {
          clearTimeout(pingTimeoutRef.current);
          pingTimeoutRef.current = null;
        }
      }
    };

    window.addEventListener('message', handlePingPong);

    const checkStatus = () => {
      // Clear any existing active timeout first
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }

      // Set timeout to wait for pong response
      pingTimeoutRef.current = setTimeout(() => {
        console.log('[PrivacyLens Dashboard] Ping timeout fired. hasDetectedExtension:', hasDetectedExtension.current);
        if (hasDetectedExtension.current) {
          setExtensionStatus('Off');
        } else {
          setExtensionStatus('Not Installed');
        }
      }, 1500);

      console.log('[PrivacyLens Dashboard] Posting PingExtension to page...');
      window.postMessage({ direction: 'from-page', type: 'PingExtension' }, '*');
    };

    const interval = setInterval(checkStatus, 5000);
    // Initial immediate ping
    checkStatus();

    return () => {
      clearInterval(interval);
      window.removeEventListener('message', handlePingPong);
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }
    };
  }, []);

  // Load live data from backend on mount and listen for authoritative Chrome Extension sync
  React.useEffect(() => {
    fetchDashboardData();
    fetchRequests();
    fetchAuditLogs();

    const applyExtensionSync = (data) => {
      if (!data) return;

      // Idempotency / Duplicate Event Prevention
      if (data.eventId) {
        if (processedSyncIds.current.has(data.eventId)) return;
        processedSyncIds.current.add(data.eventId);
        // Cap set size to 1000
        if (processedSyncIds.current.size > 1000) {
          const first = processedSyncIds.current.values().next().value;
          processedSyncIds.current.delete(first);
        }
      }

      const extVisitedWebsites = data.visitedWebsites || [];
      const extExposures = data.exposures || {};
      const extVisits = data.recentWebsiteVisits || [];
      const extWebCount = typeof data.webCount === 'number' ? data.webCount : extVisitedWebsites.length;
      const extExposureCount = typeof data.exposureCount === 'number' ? data.exposureCount : Object.keys(extExposures).length;
      const extScore = typeof data.privacyScore === 'number' ? data.privacyScore : 100;

      setExtensionData({
        webCount: extWebCount,
        exposureCount: extExposureCount,
        visitedWebsites: extVisitedWebsites,
        exposures: extExposures,
        privacyScore: extScore,
        isExtensionSynced: true
      });

      // Consolidate unique non-excluded domains from extension
      const allExtDomains = new Set([
        ...extVisitedWebsites,
        ...extVisits.map(v => v.domain),
        ...Object.keys(extExposures)
      ]);

      if (allExtDomains.size > 0) {
        setWebsites(prevWebsites => {
          const siteMap = new Map();

          // Build digital footprint grid strictly using extension tracked domains
          allExtDomains.forEach(domainStr => {
            if (!domainStr || domainStr === 'unknown' || domainStr.includes('google.com')) return;
            const norm = domainStr.toLowerCase();
            const expRecord = extExposures[norm];

            siteMap.set(norm, {
              id: `ext_site_${norm}`,
              domain: norm,
              name: norm.charAt(0).toUpperCase() + norm.slice(1),
              category: norm.includes('shop') ? 'E-Commerce' : 'Tracked Web Service',
              riskLevel: (expRecord?.riskLevel) ? expRecord.riskLevel.charAt(0).toUpperCase() + expRecord.riskLevel.slice(1) : 'Low',
              deletionTier: 2,
              directApiUrl: null,
              guidedUrl: `https://${norm}`,
              faviconUrl: `https://www.google.com/s2/favicons?domain=${norm}`,
              dataItems: expRecord?.dataTypes || ['visited_page'],
              activeConsents: expRecord?.consentTypes || ['essential'],
              consents: (expRecord?.consentTypes || ['essential']).map(c => ({
                id: `c_${Math.random()}`,
                consentType: c,
                status: 'ACTIVE',
                grantedAt: new Date().toISOString()
              })),
              requests: []
            });
          });

          return Array.from(siteMap.values());
        });
      }
    };

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'RECLAIM_EXTENSION_SYNC') {
        applyExtensionSync(event.data);
      }
    };
    window.addEventListener('message', handleMessage);

    const handleCustomEvent = (event) => {
      if (event.detail) {
        applyExtensionSync(event.detail);
      }
    };
    window.addEventListener('reclaim_extension_sync_event', handleCustomEvent);

    // Initial check from localStorage + request fresh sync trigger
    try {
      const saved = localStorage.getItem('reclaim_extension_sync');
      if (saved) {
        applyExtensionSync(JSON.parse(saved));
      }
    } catch (e) {}

    window.postMessage({ type: 'REQUEST_EXTENSION_SYNC' }, '*');

    const handleFocus = () => {
      window.postMessage({ type: 'REQUEST_EXTENSION_SYNC' }, '*');
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('reclaim_extension_sync_event', handleCustomEvent);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // SSE Real-time Updates Listener for single source of truth sync
  React.useEffect(() => {
    if (!userData || !userData.id) return;

    console.log(`[PrivacyLens Dashboard] Connecting to SSE realtime endpoint for user ${userData.id}...`);
    const sse = new EventSource(`http://localhost:5000/api/realtime/${userData.id}`);

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[PrivacyLens Dashboard] Realtime update received:', data);

        // Fetch latest metrics and visited websites list from DB to render grid and stats live
        fetchDashboardData(userData.id);
        fetchRequests(userData.id);
        fetchAuditLogs(userData.id);
      } catch (err) {
        console.error('[PrivacyLens Dashboard] Error parsing realtime SSE payload:', err);
      }
    };

    return () => {
      console.log('[PrivacyLens Dashboard] Closing SSE realtime connection...');
      sse.close();
    };
  }, [userData?.id]);

  // Calculate local privacy score fallback if Extension sync not active
  const privacyScore = useMemo(() => {
    if (extensionData.isExtensionSynced) {
      return extensionData.privacyScore;
    }
    if (backendActive) {
      return userData.privacyScore || 100;
    }
    let score = 100;
    websites.forEach(site => {
      if (site.riskLevel === 'High') score -= 10;
      if (site.riskLevel === 'Medium') score -= 5;
    });
    return Math.min(100, Math.max(10, score));
  }, [websites, userData, backendActive, extensionData]);

  // Authoritative Overall Stats (Extension = Single Source of Truth)
  const stats = useMemo(() => {
    const totalWebsites = extensionData.isExtensionSynced ? extensionData.webCount : websites.length;
    const activeScore = extensionData.isExtensionSynced ? extensionData.privacyScore : privacyScore;

    let activeConsentsCount = 0;
    if (extensionData.isExtensionSynced) {
      activeConsentsCount = extensionData.exposureCount;
    } else if (backendActive) {
      activeConsentsCount = userData.activeConsents || 0;
    } else {
      websites.forEach(site => {
        const hasActiveConsent = (site.consents || []).some(c => c.status === 'ACTIVE');
        if (hasActiveConsent) activeConsentsCount++;
      });
    }

    const pendingRequestsCount = requests.filter(r => r.status !== 'COMPLETED').length;

    return {
      totalWebsites: totalWebsites,
      exposureCount: extensionData.exposureCount,
      activeConsents: activeConsentsCount,
      pendingRequests: pendingRequestsCount,
      privacyScore: activeScore
    };
  }, [websites, requests, privacyScore, extensionData, backendActive, userData]);

  // Filtered websites
  const filteredWebsites = useMemo(() => {
    return websites.filter(site => {
      const matchesSearch = site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            site.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            site.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRisk = riskFilter === 'ALL' || site.riskLevel === riskFilter;
      const matchesTier = tierFilter === 'ALL' || site.deletionTier.toString() === tierFilter;

      return matchesSearch && matchesRisk && matchesTier;
    });
  }, [websites, searchQuery, riskFilter, tierFilter]);

  // Action: Open Website Detail
  const openDetailModal = (website) => {
    setSelectedWebsite(website);
    setActiveModal('DETAIL');
  };

  // Action: Close all modals
  const closeModal = () => {
    setActiveModal(null);
    setActionTargetConsent(null);
  };

  // Action: Trigger Tier 1 Direct API Revoke
  const triggerTier1Revoke = (website, consent) => {
    setSelectedWebsite(website);
    setActionTargetConsent(consent);
    setActiveModal('TIER1');
  };

  // Action: Execute Tier 1 Revocation
  const executeTier1Revoke = async (websiteId, consentType) => {
    // Local Optimistic UI State update
    setWebsites(prev => prev.map(site => {
      if (site.id === websiteId) {
        return {
          ...site,
          consents: site.consents.map(c => {
            if (c.consentType === consentType) {
              return { ...c, status: 'REVOKED', revokedAt: new Date().toISOString() };
            }
            return c;
          })
        };
      }
      return site;
    }));

    try {
      // Post request to backend API
      const response = await fetch('http://localhost:5000/api/requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id || 'usr_12345',
          websiteId,
          requestType: 'CONSENT_REVOCATION',
          targetConsent: consentType,
          tier: 1,
          methodUsed: 'TIER1_DIRECT_API'
        })
      });

      if (response.ok) {
        // Re-sync with backend database
        await fetchDashboardData(userData.id || 'usr_12345');
        await fetchRequests(userData.id || 'usr_12345');
        await fetchAuditLogs(userData.id || 'usr_12345');
      }
    } catch (err) {
      console.warn("Backend offline. Simulating request tracking locally.");
      
      const targetSite = websites.find(w => w.id === websiteId);
      const newReqId = `req_${Date.now()}`;
      const newRefId = `PL-REV-${Math.floor(100000 + Math.random() * 900000)}`;

      // Add to Request Tracker
      const newRequest = {
        id: newReqId,
        siteId: websiteId,
        siteName: targetSite?.name || 'Website',
        domain: targetSite?.domain || '',
        requestType: 'CONSENT_REVOCATION',
        targetConsent: consentType,
        tier: 1,
        methodUsed: 'TIER1_DIRECT_API',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        referenceId: newRefId
      };
      setRequests(prev => [newRequest, ...prev]);

      // Add to Audit Log
      const newAudit = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        siteName: targetSite?.name || 'Website',
        action: 'CONSENT_REVOCATION',
        description: `Revoked "${consentType}" consent via Tier 1 Direct API execution.`,
        dpdpProof: 'DPDP §6(4) Immediate Revocation Executed'
      };
      setAuditLogs(prev => [newAudit, ...prev]);
    }
  };

  // Action: Trigger Tier 2 Guided URL
  const triggerTier2Guided = (website) => {
    setSelectedWebsite(website);
    setActiveModal('TIER2');
  };

  // Action: Confirm Tier 2 Action Initiated
  const executeTier2Initiate = async (websiteId) => {
    try {
      const response = await fetch('http://localhost:5000/api/requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id || 'usr_12345',
          websiteId,
          requestType: 'ACCOUNT_DELETION',
          targetConsent: 'Account & Data Removal',
          tier: 2,
          methodUsed: 'TIER2_GUIDED'
        })
      });

      if (response.ok) {
        await fetchDashboardData(userData.id || 'usr_12345');
        await fetchRequests(userData.id || 'usr_12345');
        await fetchAuditLogs(userData.id || 'usr_12345');
      }
    } catch (err) {
      console.warn("Backend offline. Logging guided initiation locally.");

      const targetSite = websites.find(w => w.id === websiteId);
      const newReqId = `req_${Date.now()}`;
      const newRefId = `PL-GUIDE-${Math.floor(100000 + Math.random() * 900000)}`;

      const newRequest = {
        id: newReqId,
        siteId: websiteId,
        siteName: targetSite?.name || 'Website',
        domain: targetSite?.domain || '',
        requestType: 'ACCOUNT_DELETION',
        targetConsent: 'Account & Data Removal',
        tier: 2,
        methodUsed: 'TIER2_GUIDED_URL',
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        referenceId: newRefId
      };
      setRequests(prev => [newRequest, ...prev]);

      const newAudit = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        siteName: targetSite?.name || 'Website',
        action: 'DELETION_REQUESTED',
        description: `Opened Tier 2 Guided Deletion portal and logged user initiation.`,
        dpdpProof: 'DPDP §12 Self-Serve Request Initiated'
      };
      setAuditLogs(prev => [newAudit, ...prev]);
    }

    closeModal();
  };

  // Action: Trigger Tier 3 Letter Generator
  const triggerTier3Letter = (website, requestType = 'DATA_ERASURE') => {
    setSelectedWebsite(website);
    setActionTargetConsent(requestType);
    setActiveModal('TIER3');
  };

  // Action: Submit Tier 3 DPDP Notice
  const executeTier3Submit = async (websiteId, requestType, letterText) => {
    try {
      const response = await fetch('http://localhost:5000/api/requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id || 'usr_12345',
          websiteId,
          requestType,
          tier: 3,
          methodUsed: 'TIER3_GENERATED_NOTICE',
          requestText: letterText
        })
      });

      if (response.ok) {
        await fetchDashboardData(userData.id || 'usr_12345');
        await fetchRequests(userData.id || 'usr_12345');
        await fetchAuditLogs(userData.id || 'usr_12345');
      }
    } catch (err) {
      console.warn("Backend offline. Logging notice notice locally.");

      const targetSite = websites.find(w => w.id === websiteId);
      const newReqId = `req_${Date.now()}`;
      const newRefId = `DPDP-NOTICE-2026-${Math.floor(100 + Math.random() * 900)}`;

      const newRequest = {
        id: newReqId,
        siteId: websiteId,
        siteName: targetSite?.name || 'Website',
        domain: targetSite?.domain || '',
        requestType: requestType,
        targetConsent: requestType === 'DATA_ERASURE' ? 'Complete Data Erasure (§12)' : 'Consent Withdrawal (§6)',
        tier: 3,
        methodUsed: 'TIER3_GENERATED_NOTICE',
        status: 'SUBMITTED',
        requestText: letterText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        referenceId: newRefId
      };
      setRequests(prev => [newRequest, ...prev]);

      const newAudit = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        siteName: targetSite?.name || 'Website',
        action: 'DELETION_REQUESTED',
        description: `Generated and dispatched formal DPDP Act Notice (${requestType}). Ref: ${newRefId}`,
        dpdpProof: 'DPDP Statutory Notice Dispatched'
      };
      setAuditLogs(prev => [newAudit, ...prev]);
    }

    closeModal();
  };

  // Action: Reset Dashboard
  const resetDashboard = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/demo/reset', {
        method: 'POST'
      });
      if (response.ok) {
        // Force session and user state to default demo user Joshua (usr_12345)
        localStorage.setItem('privacylens_token', 'token_usr_12345');
        
        // Notify extension of session reset
        const defaultUser = {
          id: 'usr_12345',
          name: 'Joshua',
          email: 'joshua@example.com',
          privacyScore: 72
        };
        setUserData(defaultUser);
        setIsAuthenticated(true);
        setBackendActive(true);

        window.postMessage({
          direction: 'from-page',
          type: 'SetExtensionSession',
          detail: { token: 'token_usr_12345', user: defaultUser }
        }, '*');

        // Clear local storage sync cache
        localStorage.removeItem('reclaim_extension_sync');

        // Clear extension local data
        window.postMessage({
          direction: 'from-page',
          type: 'ClearExtensionData'
        }, '*');

        await fetchDashboardData('usr_12345');
        await fetchRequests('usr_12345');
        await fetchAuditLogs('usr_12345');
        return true;
      }
    } catch (err) {
      console.warn("Backend offline. Fallback to mock reset.");
    }
    // Fallback to resetting state to empty/initial mock data locally
    setWebsites([]);
    setRequests([]);
    setAuditLogs([]);
    setNominees([]);
    setBreaches([]);
    setUserData({
      id: 'usr_12345',
      name: 'Joshua',
      email: 'joshua@example.com',
      privacyScore: 100
    });
    return false;
  };

  const addNominee = async (name, email, relationship) => {
    try {
      const res = await fetch('http://localhost:5000/api/nominees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id || 'usr_12345', name, email, relationship })
      });
      if (res.ok) {
        await fetchDashboardData(userData.id || 'usr_12345');
        return { success: true };
      }
    } catch (err) {
      console.warn("Backend offline. Simulating local nominee addition.");
      setNominees(prev => [...prev, { id: `nom_${Date.now()}`, name, email, relationship, confirmed: true }]);
      return { success: true };
    }
  };

  const removeNominee = async (nomineeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/nominees/${nomineeId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchDashboardData(userData.id || 'usr_12345');
        return { success: true };
      }
    } catch (err) {
      console.warn("Backend offline. Simulating local nominee removal.");
      setNominees(prev => prev.filter(n => n.id !== nomineeId));
      return { success: true };
    }
  };

  const updateChildConsent = async (isChild, parentEmail) => {
    try {
      const res = await fetch('http://localhost:5000/api/child-consent/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id || 'usr_12345', isChild, parentEmail })
      });
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        await fetchDashboardData(userData.id || 'usr_12345');
        return { success: true };
      }
    } catch (err) {
      console.warn("Backend offline. Simulating local child consent update.");
      setUserData(prev => ({ ...prev, isChild, parentEmail }));
      return { success: true };
    }
  };

  const reportMockBreach = async (websiteId, description, affectedCount, severity) => {
    try {
      const res = await fetch('http://localhost:5000/api/breaches/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, description, affectedCount, severity })
      });
      if (res.ok) {
        await fetchDashboardData(userData.id || 'usr_12345');
        await fetchAuditLogs(userData.id || 'usr_12345');
        return { success: true };
      }
    } catch (err) {
      console.warn("Backend offline. Simulating local breach reporting.");
      const website = websites.find(w => w.id === websiteId);
      setBreaches(prev => [...prev, {
        id: `breach_${Date.now()}`,
        websiteId,
        description,
        affectedCount,
        severity,
        reportedToBoard: true,
        website: website || { name: 'Unknown' }
      }]);
      return { success: true };
    }
  };

  return (
    <PrivacyContext.Provider
      value={{
        userData,
        isAuthenticated,
        authLoading,
        extensionStatus,
        login,
        register,
        logout,
        websites,
        filteredWebsites,
        requests,
        auditLogs,
        nominees,
        breaches,
        stats,
        searchQuery,
        setSearchQuery,
        riskFilter,
        setRiskFilter,
        tierFilter,
        setTierFilter,
        selectedWebsite,
        activeModal,
        actionTargetConsent,
        openDetailModal,
        closeModal,
        triggerTier1Revoke,
        executeTier1Revoke,
        triggerTier2Guided,
        executeTier2Initiate,
        triggerTier3Letter,
        executeTier3Submit,
        resetDashboard,
        featureToggles,
        toggleFeature,
        addNominee,
        removeNominee,
        updateChildConsent,
        reportMockBreach
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};
