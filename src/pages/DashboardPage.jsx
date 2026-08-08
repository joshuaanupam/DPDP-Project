import React, { useState } from 'react';
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
import { Shield, Layers, FileText, History, Sparkles, ShieldAlert, UserPlus, Scale } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('FOOTPRINT'); // 'FOOTPRINT', 'TRACKER', 'AUDIT'
  const { resetDashboard, isAuthenticated, authLoading } = usePrivacy();

  if (authLoading || !isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-white flex flex-col font-sans relative overflow-hidden">
      
      {/* Decorative Background Blobs for Glassmorphism Contrast */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-400/30 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[45%] rounded-full bg-cyan-400/30 blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-400/30 blur-[120px]" />
      </div>

      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome / Hero Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden border border-indigo-500/20 dark:border-slate-850 shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-300" /> DPDP Privacy Shield Active
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">Zero Credential Retention Guarantee</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
                Control Your <span className="gradient-text">Digital Footprint</span>
              </h1>
              <p className="text-sm text-slate-700 dark:text-slate-300 max-w-2xl mt-2 leading-relaxed">
                Discover which websites hold your personal data, understand active consent agreements, and execute 3-Tier DPDP statutory actions with immutable audit proof.
              </p>
            </div>

            {/* Navigation Tab Selector */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/5 dark:bg-slate-900/30 shadow-inner border border-slate-900/10 dark:border-slate-800 shrink-0 max-w-full">
              <button
                onClick={() => setActiveTab('FOOTPRINT')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  activeTab === 'FOOTPRINT'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Footprint Grid</span>
              </button>

              <button
                onClick={() => setActiveTab('TRACKER')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  activeTab === 'TRACKER'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Request Tracker</span>
              </button>

              <button
                onClick={() => setActiveTab('AUDIT')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  activeTab === 'AUDIT'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-slate-950 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Audit Log</span>
              </button>

              <button
                onClick={() => setActiveTab('NOMINATION')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  activeTab === 'NOMINATION'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-slate-950 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nominate Guardian</span>
              </button>

              <button
                onClick={() => setActiveTab('BREACH')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  activeTab === 'BREACH'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-slate-950 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Breach Reporter</span>
              </button>

              <button
                onClick={() => setActiveTab('PENALTY')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  activeTab === 'PENALTY'
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-slate-950 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Penalty Shield</span>
              </button>
            </div>

          </div>
        </div>

        {/* Overview Stat Cards */}
        <OverviewStats />

        {/* Dynamic Tab Content */}
        {activeTab === 'FOOTPRINT' && <DigitalFootprintGrid />}
        {activeTab === 'TRACKER' && <RequestTracker />}
        {activeTab === 'AUDIT' && <AuditLogTimeline />}
        {activeTab === 'NOMINATION' && <NominationForm />}
        {activeTab === 'BREACH' && <BreachWizard />}
        {activeTab === 'PENALTY' && <PenaltyShield />}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 PrivacyLens — Built strictly under DPDP Act 2023 Guidelines.</p>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to reset the PrivacyLens demo database?")) {
                  resetDashboard();
                }
              }}
              className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-all font-semibold flex items-center space-x-1"
            >
              Reset Demo Database
            </button>
            <span>•</span>
            <span>Team Member 3 (Web Dashboard)</span>
            <span>•</span>
            <span className="text-indigo-400 font-semibold">Single Source of Truth Verified</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <WebsiteDetailModal />
      <Tier1DirectAction />
      <Tier2GuidedAction />
      <Tier3LetterGenerator />

    </div>
  );
};
