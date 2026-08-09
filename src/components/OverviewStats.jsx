import React from 'react';
import { Globe, ShieldAlert, Clock, Sparkles, AlertTriangle, ArrowUpRight, BarChart2 } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';
import { DigitalFootprintGrid } from './DigitalFootprintGrid';

export const OverviewStats = ({ footprintExpanded, setFootprintExpanded }) => {
  const { stats } = usePrivacy();

  const getScoreColor = (score) => {
    if (score >= 80) return { text: 'text-emerald-600 dark:text-emerald-400', iconColor: 'text-emerald-500', label: 'Low Exposure Risk' };
    if (score >= 50) return { text: 'text-amber-600 dark:text-amber-400', iconColor: 'text-amber-500', label: 'Moderate Exposure' };
    return { text: 'text-rose-600 dark:text-rose-400', iconColor: 'text-rose-500', label: 'High Exposure' };
  };

  const scoreInfo = getScoreColor(stats.privacyScore);


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">

      {/* Stat 1: Digital Footprint Overview (clickable accordion) */}
      <div
        className={`bg-beige-50 dark:bg-zinc-900/60 rounded-lg relative overflow-hidden transition-all text-left w-full ${footprintExpanded ? 'col-span-1 sm:col-span-2 lg:col-span-4 ring-2 ring-beige-900/30 dark:ring-beige-300/30' : ''}`}
      >
        <div
          onClick={() => setFootprintExpanded(prev => !prev)}
          id="overview-stat-footprint"
          className="p-5 cursor-pointer hover:ring-2 hover:ring-beige-900/30 dark:hover:ring-beige-300/30 transition-all group relative z-10"
        >
          {/* Large background watermark only */}
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Globe className="w-20 h-20 text-beige-900 dark:text-white" />
          </div>

          <div className="mb-3 relative z-10">
            <span className="text-[10px] font-bold text-beige-800 dark:text-zinc-400 uppercase tracking-wider">Digital Footprint Overview</span>
          </div>
          <div className="flex items-baseline space-x-1.5 relative z-10">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">{stats.totalWebsites}</span>
            <span className="text-[10px] font-medium text-beige-800 dark:text-zinc-400">services</span>
          </div>
          <div className="mt-3 pt-3 border-t border-beige-400/20 dark:border-zinc-800/40 flex items-center justify-between text-[10px] relative z-10">
            <span className="text-beige-800 dark:text-zinc-400 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-beige-900 dark:text-beige-300" /> Click to View
            </span>
            <span className="text-beige-900 dark:text-beige-300 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> {footprintExpanded ? 'Close' : 'Open'}
            </span>
          </div>
        </div>

        {footprintExpanded && (
          <div className="border-t border-beige-400/30 dark:border-zinc-800/60 p-2 sm:p-5 relative z-10 bg-white/50 dark:bg-zinc-950/50">
            <DigitalFootprintGrid />
          </div>
        )}
      </div>

      {/* Stat 2: Active Consents */}
      <div className="bg-beige-50 dark:bg-zinc-900/60 p-5 rounded-lg relative overflow-hidden group flex flex-col">
        {/* Large background watermark only */}
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <ShieldAlert className="w-20 h-20 text-amber-500" />
        </div>

        <div className="mb-3 relative z-10">
          <span className="text-[10px] font-bold text-beige-800 dark:text-zinc-400 uppercase tracking-wider">Active Consents</span>
        </div>
        <div className="flex items-baseline space-x-1.5 relative z-10 flex-1">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">{stats.activeConsents}</span>
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">permissions</span>
        </div>
        <div className="mt-3 pt-3 border-t border-beige-400/20 dark:border-zinc-800/40 flex items-center justify-between text-[10px] relative z-10">
          <span className="text-beige-800 dark:text-zinc-400 flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-500" /> Marketing &amp; Ads
          </span>
          <span className="text-amber-600 dark:text-amber-400 font-bold">Revokable</span>
        </div>
      </div>

      {/* Stat 3: Pending Privacy Requests */}
      <div className="bg-beige-50 dark:bg-zinc-900/60 p-5 rounded-lg relative overflow-hidden group flex flex-col">
        {/* Large background watermark only */}
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <Clock className="w-20 h-20 text-cyan-500" />
        </div>

        <div className="mb-3 relative z-10">
          <span className="text-[10px] font-bold text-beige-800 dark:text-zinc-400 uppercase tracking-wider">Pending Requests</span>
        </div>
        <div className="flex items-baseline space-x-1.5 relative z-10 flex-1">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading">{stats.pendingRequests}</span>
          <span className="text-[10px] font-medium text-cyan-600 dark:text-cyan-400">in-flight</span>
        </div>
        <div className="mt-3 pt-3 border-t border-beige-400/20 dark:border-zinc-800/40 flex items-center justify-between text-[10px] relative z-10">
          <span className="text-beige-800 dark:text-zinc-400">Audit Proof Log</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center">
            Tracker Ready <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* Stat 4: Privacy Score with bar chart watermark */}
      <div className="bg-beige-50 dark:bg-zinc-900/60 p-5 rounded-lg relative overflow-hidden group flex flex-col">
        {/* Large background watermark — same style as other cards */}
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <BarChart2 className={`w-20 h-20 ${scoreInfo.iconColor}`} />
        </div>

        <div className="mb-3 relative z-10">
          <span className="text-[10px] font-bold text-beige-800 dark:text-zinc-400 uppercase tracking-wider">Privacy Score</span>
        </div>

        <div className="flex items-baseline space-x-1 relative z-10 flex-1">
          <span className={`text-3xl font-black font-heading ${scoreInfo.text}`}>{stats.privacyScore}</span>
          <span className="text-xs font-bold text-slate-500">/ 100</span>
        </div>

        <div className="mt-3 pt-3 border-t border-beige-400/20 dark:border-zinc-800/40 text-[10px] relative z-10">
          <span className={`font-bold ${scoreInfo.text}`}>{scoreInfo.label}</span>
        </div>
      </div>

    </div>
  );
};
