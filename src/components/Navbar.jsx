import React from 'react';
import { Shield, Sparkles, User, Activity, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const Navbar = () => {
  const { userData, stats } = usePrivacy();
  const score = stats.privacyScore;

  // Determine score color theme
  const getScoreBadge = (s) => {
    if (s >= 80) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]', label: 'OPTIMAL PRIVACY' };
    if (s >= 50) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]', label: 'MODERATE RISK' };
    return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]', label: 'HIGH EXPOSURE' };
  };

  const badge = getScoreBadge(score);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Shield className="w-6 h-6 text-slate-900" />
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900">
                  Privacy<span className="gradient-text">Lens</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  DPDP Shield
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">Digital Footprint & Rights Control Center</p>
            </div>
          </div>

          {/* Center: Digital Privacy Score Pill */}
          <div className="hidden md:flex items-center space-x-3">
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-full border ${badge.border} ${badge.bg} ${badge.glow} transition-all duration-300`}>
              <div className="relative flex items-center justify-center">
                <svg className="w-9 h-9 transform -rotate-90">
                  <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-800" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={88}
                    strokeDashoffset={88 - (88 * score) / 100}
                    className={`${badge.text} transition-all duration-700 ease-out`}
                  />
                </svg>
                <span className={`absolute text-xs font-extrabold ${badge.text}`}>
                  {score}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold text-slate-700">Privacy Index Score</span>
                  <span className={`text-[10px] font-extrabold tracking-wider uppercase px-1.5 py-0.2 rounded ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">Live DPDP §6 Risk Weighting</p>
              </div>
            </div>
          </div>

          {/* Right: Extension Status & User Profile */}
          <div className="flex items-center space-x-4">
            
            {/* MV3 Extension Active Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold">MV3 Extension Sync Active</span>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-200/50">
              <div className="flex items-center justify-center w-9 h-9 rounded-full glass-panel border border-slate-200/50 text-indigo-400 font-semibold shadow-inner">
                {userData.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{userData.name}</p>
                <p className="text-xs text-slate-600 truncate max-w-[120px]">{userData.email}</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
