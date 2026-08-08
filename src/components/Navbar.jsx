import React, { useState } from 'react';
import { Shield, Sparkles, User, Activity, RefreshCw, CheckCircle2, Lock, Sun, Moon, LogOut } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const Navbar = () => {
  const { userData, stats, logout, extensionStatus } = usePrivacy();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleDark = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const score = stats.privacyScore;

  // Determine score color theme
  const getScoreBadge = (s) => {
    if (s >= 80) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]', label: 'OPTIMAL PRIVACY' };
    if (s >= 50) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]', label: 'MODERATE RISK' };
    return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]', label: 'HIGH EXPOSURE' };
  };

  const badge = getScoreBadge(score);

  return (
    <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-zinc-950/80 border-b border-beige-400/40 dark:border-zinc-800/40 backdrop-blur-md">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Section title */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-beige-800 dark:text-zinc-400 uppercase tracking-widest">
              DPDP Compliance Monitor
            </span>
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
            
            {/* MV3 Extension Sync Badge */}
            {extensionStatus === 'Active' && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold">MV3 Extension Sync Active</span>
              </div>
            )}
            {extensionStatus === 'Off' && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-semibold">MV3 Extension Sync Off</span>
              </div>
            )}
            {extensionStatus === 'Not Installed' && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                </span>
                <span className="font-semibold">MV3 Extension Not Installed</span>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl bg-beige-50 border border-beige-400/40 text-beige-900 hover:bg-beige-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-beige-300 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center space-x-3 pl-3 border-l border-beige-400/40 dark:border-zinc-800/40">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-beige-100 dark:bg-zinc-800 text-beige-900 dark:text-beige-300 font-bold border border-beige-400/30 text-xs">
                {userData.name ? userData.name.charAt(0) : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{userData.name || 'User'}</p>
                <p className="text-[10px] text-beige-800 dark:text-zinc-400 truncate max-w-[120px]">{userData.email || ''}</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
