import React, { createContext, useContext, useState, useMemo } from 'react';
import initialData from '../mocks/mockDashboardData.json';

const PrivacyContext = createContext();

export const PrivacyProvider = ({ children }) => {
  const [userData, setUserData] = useState(initialData.user);
  const [websites, setWebsites] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [backendActive, setBackendActive] = useState(false);

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
        setBackendActive(true);
      } else {
        // Fallback to mock data if 404/500
        setWebsites(initialData.websites);
      }
    } catch (err) {
      console.warn("Backend API offline. Using mock dashboard data.");
      setWebsites(initialData.websites);
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

  // Load live data from backend on mount
  React.useEffect(() => {
    fetchDashboardData();
    fetchRequests();
    fetchAuditLogs();
  }, []);

  // Recalculate dynamic privacy score (local state calculation or fallback)
  const privacyScore = useMemo(() => {
    if (backendActive) {
      return userData.privacyScore || 100;
    }
    let score = 100;
    websites.forEach(site => {
      if (site.riskLevel === 'High') score -= 10;
      if (site.riskLevel === 'Medium') score -= 5;

      site.consents.forEach(consent => {
        if (consent.status === 'ACTIVE' && (
          consent.consentType.toLowerCase().includes('marketing') ||
          consent.consentType.toLowerCase().includes('sharing') ||
          consent.consentType.toLowerCase().includes('tracking') ||
          consent.consentType.toLowerCase().includes('ad')
        )) {
          score -= 5;
        }
        if (consent.status === 'REVOKED') {
          score += 3;
        }
      });
    });
    return Math.min(100, Math.max(10, score));
  }, [websites, userData, backendActive]);

  // Overall Stats
  const stats = useMemo(() => {
    let activeConsentsCount = 0;
    websites.forEach(site => {
      site.consents.forEach(c => {
        if (c.status === 'ACTIVE') activeConsentsCount++;
      });
    });

    const pendingRequestsCount = requests.filter(r => r.status !== 'COMPLETED').length;

    return {
      totalWebsites: websites.length,
      activeConsents: activeConsentsCount,
      pendingRequests: pendingRequestsCount,
      privacyScore: privacyScore
    };
  }, [websites, requests, privacyScore]);

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
          userId: 'usr_12345',
          websiteId,
          requestType: 'CONSENT_REVOCATION',
          targetConsent: consentType,
          tier: 1,
          methodUsed: 'TIER1_DIRECT_API'
        })
      });

      if (response.ok) {
        // Re-sync with backend database
        await fetchDashboardData();
        await fetchRequests();
        await fetchAuditLogs();
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
          userId: 'usr_12345',
          websiteId,
          requestType: 'ACCOUNT_DELETION',
          targetConsent: 'Account & Data Removal',
          tier: 2,
          methodUsed: 'TIER2_GUIDED'
        })
      });

      if (response.ok) {
        await fetchDashboardData();
        await fetchRequests();
        await fetchAuditLogs();
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
          userId: 'usr_12345',
          websiteId,
          requestType,
          tier: 3,
          methodUsed: 'TIER3_GENERATED_NOTICE',
          requestText: letterText
        })
      });

      if (response.ok) {
        await fetchDashboardData();
        await fetchRequests();
        await fetchAuditLogs();
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
        await fetchDashboardData();
        await fetchRequests();
        await fetchAuditLogs();
        return true;
      }
    } catch (err) {
      console.warn("Backend offline. Fallback to mock reset.");
    }
    // Fallback to resetting state to empty/initial mock data locally
    setWebsites([]);
    setRequests([]);
    setAuditLogs([]);
    setUserData({
      id: 'usr_12345',
      name: 'Joshua',
      email: 'joshua@example.com',
      privacyScore: 100
    });
    return false;
  };

  return (
    <PrivacyContext.Provider
      value={{
        userData,
        websites,
        filteredWebsites,
        requests,
        auditLogs,
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
        resetDashboard
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
