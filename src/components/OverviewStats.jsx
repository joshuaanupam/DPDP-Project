import React from 'react';
import { Globe, Shield, Clock, ShieldAlert, Sparkles, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const OverviewStats = () => {
  const { stats } = usePrivacy();

  const getScoreColor = (score) => {
    if (score >= 80) return { text: 'text-emerald-400', stroke: '#10B981', label: 'Low Exposure Risk' };
    if (score >= 50) return { text: 'text-amber-400', stroke: '#F59E0B', label: 'Moderate Exposure' };
    return { text: 'text-rose-400', stroke: '#EF4444', label: 'High Exposure' };
  };

  const scoreInfo = getScoreColor(stats.privacyScore);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      
      {/* Stat 1: Connected Websites */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Globe className="w-20 h-20 text-indigo-400" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Connected Sites</span>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Globe className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 font-heading">{stats.totalWebsites}</span>
          <span className="text-xs font-medium text-slate-600">tracked web services</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between text-xs">
          <span className="text-slate-600 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Passive MV3 Detection
          </span>
          <span className="text-indigo-400 font-semibold">100% Live</span>
        </div>
      </div>

      {/* Stat 2: Active Consents */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ShieldAlert className="w-20 h-20 text-amber-400" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Active Consents</span>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 font-heading">{stats.activeConsents}</span>
          <span className="text-xs font-medium text-amber-400/90 font-medium">active permissions</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between text-xs">
          <span className="text-slate-600 flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" /> Marketing & Ads
          </span>
          <span className="text-amber-400 font-semibold">Revokable</span>
        </div>
      </div>

      {/* Stat 3: Pending Privacy Requests */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Clock className="w-20 h-20 text-cyan-400" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Pending Requests</span>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 font-heading">{stats.pendingRequests}</span>
          <span className="text-xs font-medium text-cyan-400">in-flight DPDP requests</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between text-xs">
          <span className="text-slate-600">Audit Proof Logging</span>
          <span className="text-cyan-400 font-semibold flex items-center">
            Tracker Ready <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Stat 4: Digital Privacy Score Card */}
      <div className="glass-card p-5 rounded-2xl relative overflow-hidden group border-indigo-500/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Digital Privacy Score</span>
          <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline space-x-1">
              <span className={`text-4xl font-black font-heading ${scoreInfo.text}`}>{stats.privacyScore}</span>
              <span className="text-sm font-bold text-slate-500">/ 100</span>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1">{scoreInfo.label}</p>
          </div>
          
          <div className="relative flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke={scoreInfo.stroke}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={138}
                strokeDashoffset={138 - (138 * stats.privacyScore) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <TrendingUp className={`w-4 h-4 absolute ${scoreInfo.text}`} />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between text-xs">
          <span className="text-slate-600 text-[11px]">Formula: DPDP Risk Matrix</span>
          <span className="text-indigo-300 text-[11px] font-medium">Auto-updated</span>
        </div>
      </div>

    </div>
  );
};
