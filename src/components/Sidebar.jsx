import React from 'react';
import { Shield, Sparkles, Layers, FileText, History, UserPlus, ShieldAlert, Scale, LogOut, Search, Settings } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { userData, logout } = usePrivacy();

  const navItems = [
    { id: 'FOOTPRINT', label: 'Footprint Grid', icon: Layers },
    { id: 'TRACKER', label: 'Request Tracker', icon: FileText },
    { id: 'AUDIT', label: 'Audit Log', icon: History },
    { id: 'NOMINATION', label: 'Nominate Guardian', icon: UserPlus },
    { id: 'BREACH', label: 'Breach Reporter', icon: ShieldAlert },
    { id: 'PENALTY', label: 'Penalty Shield', icon: Scale },
  ];

  return (
    <aside className="w-60 bg-white dark:bg-zinc-950 border-r border-beige-400/60 dark:border-zinc-800 flex flex-col h-screen sticky top-0 shrink-0 font-sans z-30">
      {/* Top logo area */}
      <div className="p-5 flex items-center space-x-2.5 border-b border-beige-400/20 dark:border-zinc-800/40">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-beige-900 to-beige-700 shadow-md shadow-beige-900/20">
          <Shield className="w-5 h-5 text-beige-50 dark:text-zinc-950" />
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

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
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
          <button className="flex items-center space-x-1 hover:text-beige-900 dark:hover:text-white transition-colors">
            <Settings className="w-3.5 h-3.5" />
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
