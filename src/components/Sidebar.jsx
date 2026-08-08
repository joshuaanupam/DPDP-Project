import React, { useState } from 'react';
import { Shield, Sparkles, Layers, FileText, History, UserPlus, ShieldAlert, Scale, LogOut, Search, Settings, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { userData, logout, featureToggles, toggleFeature } = usePrivacy();
  const [showSettings, setShowSettings] = useState(false);

  const allNavItems = [
    { id: 'FOOTPRINT',  label: 'Footprint Grid',     icon: Layers,      featureKey: null },
    { id: 'TRACKER',   label: 'Request Tracker',     icon: FileText,    featureKey: null },
    { id: 'AUDIT',     label: 'Audit Log',            icon: History,     featureKey: null },
    { id: 'NOMINATION',label: 'Nominate Guardian',   icon: UserPlus,    featureKey: null },
    { id: 'BREACH',    label: 'Breach Reporter',      icon: ShieldAlert, featureKey: 'breachReporter' },
    { id: 'PENALTY',   label: 'Penalty Shield',       icon: Scale,       featureKey: 'penaltyShield' },
  ];

  // Only show nav items where the feature toggle is on (or no toggle needed)
  const visibleNavItems = allNavItems.filter(item =>
    item.featureKey === null || featureToggles[item.featureKey]
  );

  const featureSettings = [
    { key: 'breachReporter', label: 'Breach Reporter', description: 'Enable DPDP breach notification wizard' },
    { key: 'penaltyShield',  label: 'Penalty Shield',  description: 'Enable DPDP penalty & complaint tracker' },
  ];

  return (
    <aside className="w-60 bg-white dark:bg-zinc-950 border-r border-beige-400/60 dark:border-zinc-800 flex flex-col h-screen sticky top-0 shrink-0 font-sans z-30">
      {/* Top logo area */}
      <div className="p-5 flex items-center space-x-2.5 border-b border-beige-400/20 dark:border-zinc-800/40">
        <div className="relative">
          <img src="/privacylens-logo.svg" alt="PrivacyLens" className="w-9 h-9 rounded-lg shadow-md shadow-beige-900/20 object-cover" />
          <Sparkles className="w-2.5 h-2.5 text-beige-300 absolute -top-0.5 -right-0.5 animate-pulse" />
        </div>
        <div>
          <span className="font-heading font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
            Privacy<span className="gradient-text">Lens</span>
          </span>
          <span className="block text-[9px] font-bold text-beige-700 dark:text-beige-300 uppercase tracking-widest leading-none mt-0.5">
            DPDP Shield
          </span>
        </div>
      </div>

      {/* Sidebar Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-beige-500" />
          <input
            type="text"
            placeholder="Search panel..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-beige-50 dark:bg-zinc-900/60 border border-beige-400/40 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-beige-900 focus:border-beige-900 dark:text-white"
          />
        </div>
      </div>

      {/* Navigation list OR Settings panel */}
      {showSettings ? (
        /* ── Settings Panel ─────────────────────────────── */
        <div className="flex-1 px-3 py-2 overflow-y-auto">
          {/* Panel header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Settings
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded-md hover:bg-beige-100 dark:hover:bg-zinc-800 text-beige-700 dark:text-zinc-400 transition-colors"
              title="Close Settings"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature toggles section */}
          <div className="mb-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-beige-600 dark:text-zinc-500 px-1 mb-2">
              Feature Modules
            </p>
            <div className="space-y-1.5">
              {featureSettings.map(({ key, label, description }) => {
                const enabled = featureToggles[key];
                return (
                  <div
                    key={key}
                    onClick={() => toggleFeature(key)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer
                      bg-beige-50 dark:bg-zinc-900/60 border border-beige-400/30 dark:border-zinc-800
                      hover:border-beige-900/40 dark:hover:border-beige-300/30 transition-all group"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className={`text-xs font-bold leading-tight ${enabled ? 'text-slate-900 dark:text-white' : 'text-beige-500 dark:text-zinc-600 line-through'}`}>
                        {label}
                      </p>
                      <p className="text-[9px] text-beige-600 dark:text-zinc-500 mt-0.5 leading-snug">
                        {description}
                      </p>
                    </div>
                    {/* Toggle switch */}
                    <div className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${enabled ? 'bg-beige-900 dark:bg-beige-300' : 'bg-beige-300 dark:bg-zinc-700'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white dark:bg-zinc-950 shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[9px] text-beige-500 dark:text-zinc-600 px-1 mt-4 leading-relaxed">
            Disabled modules are hidden from the navigation and cannot be accessed.
          </p>
        </div>
      ) : (
        /* ── Navigation list ─────────────────────────────── */
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-beige-100 dark:bg-zinc-800 text-beige-700 dark:text-beige-100 shadow-sm'
                    : 'text-beige-800 dark:text-zinc-400 hover:bg-beige-50 dark:hover:bg-zinc-900/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-beige-900 dark:text-beige-100' : 'text-beige-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Bottom Profile / Settings */}
      <div className="p-4 border-t border-beige-400/20 dark:border-zinc-800/40 space-y-3.5">
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-beige-100 dark:bg-zinc-800 text-beige-700 dark:text-beige-100 font-bold border border-beige-400/30 text-xs shadow-inner">
            {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-left min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
              {userData.name || 'User'}
            </p>
            <span className="inline-block text-[9px] font-bold text-beige-700 dark:text-beige-300 bg-beige-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded uppercase mt-0.5">
              Data Principal
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold pt-1 text-beige-800 dark:text-zinc-400">
          <button
            onClick={() => setShowSettings(s => !s)}
            className={`flex items-center space-x-1 transition-colors ${showSettings ? 'text-beige-900 dark:text-white font-bold' : 'hover:text-beige-900 dark:hover:text-white'}`}
          >
            <Settings className={`w-3.5 h-3.5 transition-transform ${showSettings ? 'rotate-45' : ''}`} />
            <span>Settings</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center space-x-1 text-rose-500 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
