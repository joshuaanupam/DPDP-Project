import React from 'react';
import { Globe, Shield, Clock, ShieldAlert, Sparkles, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const OverviewStats = ({ setActiveTab }) => {
  const { stats } = usePrivacy();

  const getScoreColor = (score) => {
    if (score >= 80) return { text: 'text-emerald-600 dark:text-emerald-400', stroke: '#10B981', label: 'Low Exposure Risk' };
    if (score >= 50) return { text: 'text-amber-600 dark:text-amber-400', stroke: '#F59E0B', label: 'Moderate Exposure' };
    return { text: 'text-rose-600 dark:text-rose-400', stroke: '#EF4444', label: 'High Exposure' };
  };

  const scoreInfo = getScoreColor(stats.privacyScore);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      
      {/* Stat 1: Digital Footprint Overview (clickable) */}
      <button
        onClick={() => {
          if (setActiveTab) {
            setActiveTab('FOOTPRINT');
            setTimeout(() => {
              document.getElementById('dynamic-tab-content')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }}
        className="bg-beige-50 dark:bg-zinc-900/60 p-5 rounded-lg relative overflow-hidden group cursor-pointer hover:ring-2 hover:ring-beige-900/30 dark:hover:ring-beige-300/30 transition-all text-left w-full"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Globe className="w-20 h-20 text-beige-900 dark:text-white" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-beige-800 dark:text-zinc-400 uppercase tracking-wider">Digital Footprint Overview</span>
          <div className="p-2 rounded-md bg-beige-100 border border-beige-400/30 text-beige-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-beige-300">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">{stats.totalWebsites}</span>
          <span className="text-[10px] font-medium text-beige-800 dark:text-zinc-400">services</span>
        </div>
        <div className="mt-3 pt-3 border-t border-beige-400/20 dark:border-zinc-800/40 flex items-center justify-between text-[10px]">
          <span className="text-beige-800 dark:text-zinc-400 flex items-center">
            <Sparkles className="w-3 h-3 mr-1 text-beige-900 dark:text-beige-300" /> Click to View
          </span>
          <span className="text-beige-900 dark:text-beige-300 font-bold flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Open</span>
        </div>
      </button>

      {/* Stat 2: Active Consents */}
      <div className="bg-beige-50 dark:bg-zinc-900/60 p-5 rounded-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <ShieldAlert className="w-20 h-20 text-amber-500" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-beige-800 dark:text-zinc-400 uppercase tracking-wider">Active Consents</span>
          <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">{stats.activeConsents}</span>
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">permissions</span>
        </div>
        <div className="mt-3 pt-3 border-t border-beige-400/20 dark:border-zinc-800/40 flex items-center justify-between text-[10px]">
          <span className="text-beige-800 dark:text-zinc-400 flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" /> Marketing & Ads
          </span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">Revokable</span>
        </div>
      </div>

      {/* Stat 3: Pending Privacy Requests */}
      <div className="bg-beige-50 dark:bg-zinc-900/60 p-5 rounded-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Clock className="w-20 h-20 text-cyan-500" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-beige-800 dark:text-zinc-400 uppercase tracking-wider">Pending Requests</span>
          <div className="p-2 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">{stats.pendingRequests}</span>
          <span className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400">in-flight</span>
        </div>
        <div className="mt-3 pt-3 border-t border-beige-400/20 dark:border-zinc-800/40 flex items-center justify-between text-[10px]">
          <span className="text-beige-800 dark:text-zinc-400">Audit Proof Log</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center">
            Tracker Ready <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Stat 4: Digital Privacy Score Card */}
      <div className="bg-beige-50 dark:bg-zinc-900/60 p-5 rounded-lg relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-beige-800 dark:text-zinc-400 uppercase tracking-wider">Privacy Score</span>
          <div className="p-2 rounded-md bg-beige-100 border border-beige-400/30 text-beige-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-beige-300">
            <Shield className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline space-x-1">
              <span className={`text-3xl font-black font-heading ${scoreInfo.text}`}>{stats.privacyScore}</span>
              <span className="text-xs font-bold text-slate-500">/ 100</span>
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">{scoreInfo.label}</p>
          </div>
          
          <div className="relative flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-200 dark:text-zinc-800" />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke={scoreInfo.stroke}
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * stats.privacyScore) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <TrendingUp className={`w-3.5 h-3.5 absolute ${scoreInfo.text}`} />
          </div>
        </div>

      </div>

    </div>
  );
};
