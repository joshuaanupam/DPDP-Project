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
import { Shield, Layers, FileText, History, Sparkles } from 'lucide-react';

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('FOOTPRINT'); // 'FOOTPRINT', 'TRACKER', 'AUDIT'

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome / Hero Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden border border-indigo-500/20 shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-300" /> DPDP Privacy Shield Active
                </span>
                <span className="text-xs text-slate-400">Zero Credential Retention Guarantee</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
                Control Your <span className="gradient-text">Digital Footprint</span>
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
                Discover which websites hold your personal data, understand active consent agreements, and execute 3-Tier DPDP statutory actions with immutable audit proof.
              </p>
            </div>

            {/* Navigation Tab Selector */}
            <div className="flex items-center p-1.5 rounded-2xl glass-card border border-slate-800 shrink-0">
              <button
                onClick={() => setActiveTab('FOOTPRINT')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'FOOTPRINT'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Footprint Grid</span>
              </button>

              <button
                onClick={() => setActiveTab('TRACKER')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'TRACKER'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Request Tracker</span>
              </button>

              <button
                onClick={() => setActiveTab('AUDIT')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'AUDIT'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Audit Log</span>
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

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 PrivacyLens — Built strictly under DPDP Act 2023 Guidelines.</p>
          <div className="flex items-center space-x-4">
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
