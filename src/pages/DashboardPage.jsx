import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { OverviewStats } from '../components/OverviewStats';
import { DigitalFootprintGrid } from '../components/DigitalFootprintGrid';
import { WebsiteDetailModal } from '../components/WebsiteDetailModal';
import { Tier1DirectAction } from '../components/Tier1DirectAction';
import { Tier2GuidedAction } from '../components/Tier2GuidedAction';
import { Tier3LetterGenerator } from '../components/Tier3LetterGenerator';
import { RequestTracker } from '../components/RequestTracker';
import { AuditLogTimeline } from '../components/AuditLogTimeline';
import { PenaltyShield } from '../components/PenaltyShield';
import { NominationForm } from '../components/NominationForm';
import { BreachWizard } from '../components/BreachWizard';
import { LoginPage } from '../components/LoginPage';
import { Sparkles } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('FOOTPRINT'); // 'FOOTPRINT', 'TRACKER', 'AUDIT'
  const { resetDashboard, isAuthenticated, authLoading, featureToggles } = usePrivacy();

  // Auto-redirect if active tab's feature gets disabled
  React.useEffect(() => {
    if (activeTab === 'BREACH' && !featureToggles.breachReporter) setActiveTab('FOOTPRINT');
    if (activeTab === 'PENALTY' && !featureToggles.penaltyShield) setActiveTab('FOOTPRINT');
  }, [featureToggles, activeTab]);

  if (authLoading || !isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-white flex font-sans relative overflow-hidden bg-beige-50 dark:bg-zinc-950">
      
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Right Content Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Top Header Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-6 max-w-6xl w-full mx-auto">
          
          {/* Welcome / Hero Banner */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden border border-beige-400/30 dark:border-zinc-800 shadow-md">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-beige-900/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-beige-100 dark:bg-zinc-800 text-beige-700 dark:text-beige-300 border border-beige-400/25 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1 text-beige-900 dark:text-beige-300 animate-pulse" /> DPDP Privacy Shield Active
                  </span>
                  <span className="text-[10px] text-beige-800 dark:text-zinc-400 font-medium">Zero Credential Retention Guarantee</span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
                  Control Your <span className="gradient-text font-black">Digital Footprint</span>
                </h1>
                <p className="text-xs text-beige-800 dark:text-zinc-400 max-w-2xl mt-1 leading-relaxed">
                  Discover which websites hold your personal data, understand active consent agreements, and execute 3-Tier DPDP statutory actions with immutable audit proof.
                </p>
              </div>
            </div>
          </div>

          {/* Overview Stat Cards — only visible on Footprint tab */}
          {(activeTab === 'FOOTPRINT' || activeTab === null) && (
            <OverviewStats activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {/* Dynamic Tab Content */}
          <div id="dynamic-tab-content" className="grid grid-cols-1 gap-6">
            {activeTab === 'TRACKER' && <RequestTracker />}
            {activeTab === 'AUDIT' && <AuditLogTimeline />}
            {activeTab === 'NOMINATION' && <NominationForm />}
            {activeTab === 'BREACH' && featureToggles.breachReporter && <BreachWizard />}
            {activeTab === 'PENALTY' && featureToggles.penaltyShield && <PenaltyShield />}
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-beige-400/20 dark:border-zinc-850 py-4 text-center text-xs text-beige-800 dark:text-zinc-400 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-md mt-auto">
          <div className="px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 PrivacyLens — Built strictly under DPDP Act 2023 Guidelines.</p>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to reset the PrivacyLens demo database?")) {
                    resetDashboard();
                  }
                }}
                className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-lg transition-all font-semibold flex items-center space-x-1"
              >
                Reset Demo Database
              </button>
              <span>•</span>
              <span className="text-beige-700 dark:text-beige-300 font-semibold">Single Source of Truth Verified</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <WebsiteDetailModal />
      <Tier1DirectAction />
      <Tier2GuidedAction />
      <Tier3LetterGenerator />

    </div>
  );
};
