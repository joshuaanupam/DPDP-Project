import React from 'react';
import { Search, Filter, ShieldAlert, Zap, ExternalLink, FileText, ChevronRight, CheckCircle2, Lock, Eye, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const DigitalFootprintGrid = () => {
  const {
    filteredWebsites,
    searchQuery,
    setSearchQuery,
    riskFilter,
    setRiskFilter,
    tierFilter,
    setTierFilter,
    openDetailModal
  } = usePrivacy();

  // Only show websites that actually have shared/provided data items
  const websitesWithDetails = React.useMemo(() => {
    return filteredWebsites.filter(site => site.dataItems && site.dataItems.length > 0);
  }, [filteredWebsites]);

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'High':
        return { bg: 'bg-rose-100 dark:bg-rose-950/20', border: 'border-rose-200 dark:border-rose-900/30', text: 'text-rose-800 dark:text-rose-400', label: 'High Risk' };
      case 'Medium':
        return { bg: 'bg-beige-300 dark:bg-zinc-800/70', border: 'border-beige-400/40 dark:border-zinc-700/60', text: 'text-beige-600 dark:text-beige-300', label: 'Medium Risk' };
      case 'Low':
        return { bg: 'bg-beige-200 dark:bg-zinc-800/40', border: 'border-beige-400/60 dark:border-zinc-700/60', text: 'text-beige-700 dark:text-beige-200', label: 'Low Risk' };
      default:
        return { bg: 'bg-beige-100 dark:bg-zinc-900', border: 'border-beige-400/30 dark:border-zinc-800', text: 'text-beige-800 dark:text-zinc-400', label: risk };
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 1:
        return { bg: 'bg-beige-100 dark:bg-zinc-900', border: 'border-beige-400/30 dark:border-zinc-800', text: 'text-beige-700 dark:text-beige-300', icon: Zap, label: 'Tier 1: Direct API' };
      case 2:
        return { bg: 'bg-beige-100 dark:bg-zinc-900', border: 'border-beige-400/30 dark:border-zinc-800', text: 'text-beige-700 dark:text-beige-300', icon: ExternalLink, label: 'Tier 2: Guided URL' };
      case 3:
        return { bg: 'bg-beige-100 dark:bg-zinc-900', border: 'border-beige-400/30 dark:border-zinc-800', text: 'text-beige-700 dark:text-beige-300', icon: FileText, label: 'Tier 3: Notice Letter' };
      default:
        return { bg: 'bg-beige-50 dark:bg-zinc-900', border: 'border-beige-400/20 dark:border-zinc-850', text: 'text-beige-600 dark:text-zinc-400', icon: FileText, label: `Tier ${tier}` };
    }
  };

  return (
    <div className="mb-6 bg-white dark:bg-zinc-900/60 rounded-xl p-4 border border-beige-400 dark:border-zinc-800 shadow-sm">
      
      {/* Controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-3 mb-4">
            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Search Input */}
              <div className="relative flex-1 min-w-[180px] sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-beige-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search website, domain..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-beige-50 dark:bg-zinc-950/60 border border-beige-400/40 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-beige-900 focus:border-beige-900 dark:text-white"
                />
              </div>

              {/* Risk Level Filter Dropdown */}
              <div className="flex items-center space-x-1 bg-beige-50 dark:bg-zinc-950/60 px-2 py-1.5 rounded-lg border border-beige-400/40 dark:border-zinc-800">
                <Filter className="w-3 h-3 text-beige-500 mr-1" />
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="ALL" className="bg-[#1C1A17] text-slate-300">All Risks</option>
                  <option value="High" className="bg-[#1C1A17] text-rose-400 font-bold">High Risk</option>
                  <option value="Medium" className="bg-[#1C1A17] text-beige-600 font-bold">Medium Risk</option>
                  <option value="Low" className="bg-[#1C1A17] text-beige-700 font-bold">Low Risk</option>
                </select>
              </div>

              {/* Tier Filter Dropdown */}
              <div className="flex items-center space-x-1 bg-beige-50 dark:bg-zinc-950/60 px-2 py-1.5 rounded-lg border border-beige-400/40 dark:border-zinc-800">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="ALL" className="bg-[#1C1A17] text-slate-300">All Tiers</option>
                  <option value="1" className="bg-[#1C1A17] text-beige-700">Tier 1: Direct API</option>
                  <option value="2" className="bg-[#1C1A17] text-beige-700">Tier 2: Guided URL</option>
                  <option value="3" className="bg-[#1C1A17] text-beige-700">Tier 3: Notice Letter</option>
                </select>
              </div>

            </div>
          </div>

          {/* Footprint Grid */}
          {websitesWithDetails.length === 0 ? (
            <div className="bg-beige-50 dark:bg-zinc-950/30 rounded-xl p-10 text-center border border-dashed border-beige-400/40 dark:border-zinc-800">
              <AlertCircle className="w-10 h-10 text-beige-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">No Tracked Websites Found</h3>
              <p className="text-xs text-beige-800 dark:text-zinc-500 mt-0.5">Try adjusting your search criteria or filter options.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {websitesWithDetails.map((site) => {
                const risk = getRiskBadge(site.riskLevel);
                const tier = getTierBadge(site.deletionTier);
                const TierIcon = tier.icon;

                const activeConsentsCount = site.consents.filter(c => c.status === 'ACTIVE').length;

                return (
                  <div
                    key={site.id}
                    className="bg-white dark:bg-zinc-900/60 rounded-xl p-4 flex flex-col justify-between border border-beige-400 dark:border-zinc-800 group hover:border-beige-900/40 transition-colors"
                  >
                    <div>
                      {/* Top Bar: Icon, Name & Badges */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-10 h-10 rounded-xl bg-beige-50 dark:bg-zinc-950 border border-beige-400/30 dark:border-zinc-800 flex items-center justify-center text-lg shadow-inner">
                            {site.favicon || site.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white font-heading group-hover:text-beige-900 dark:group-hover:text-beige-300 transition-colors">
                              {site.name}
                            </h3>
                            <p className="text-[10px] text-beige-800 dark:text-zinc-500 font-mono">{site.domain}</p>
                          </div>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${risk.border} ${risk.bg} ${risk.text}`}>
                          {risk.label}
                        </span>
                      </div>

                      {/* Tier Badge & Category */}
                      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-beige-400/25 dark:border-zinc-800/40 text-[10px]">
                        <span className="text-beige-800 dark:text-zinc-400 font-bold">{site.category}</span>
                        <span className={`flex items-center space-x-1 font-bold px-1.5 py-0.5 rounded border ${tier.border} ${tier.bg} ${tier.text}`}>
                          <TierIcon className="w-2.5 h-2.5 mr-0.5" />
                          {tier.label}
                        </span>
                      </div>

                      {/* Shared Personal Data Items */}
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-beige-800 dark:text-zinc-400 mb-1.5 flex items-center">
                          <Eye className="w-3 h-3 mr-1 text-beige-900 dark:text-beige-300" /> Shared Data Fields:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {site.dataItems.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-beige-50 dark:bg-zinc-950 text-beige-800 dark:text-zinc-300 border border-beige-400/20 dark:border-zinc-800"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Active Consents */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-beige-800 dark:text-zinc-400 font-semibold">Active Permissions</span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">{activeConsentsCount} active</span>
                        </div>
                        <div className="w-full bg-beige-50 dark:bg-zinc-950 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-amber-500 h-1 rounded-full"
                            style={{ width: `${Math.min(100, (activeConsentsCount / site.consents.length) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Inspect Action Trigger */}
                    <button
                      onClick={() => openDetailModal(site)}
                      className="w-full py-2 px-3 rounded-lg bg-beige-50 dark:bg-zinc-950 text-beige-900 dark:text-beige-300 hover:bg-beige-100 hover:text-beige-800 dark:hover:bg-zinc-800 dark:hover:text-white border border-beige-400/30 dark:border-zinc-800 font-bold text-[10px] transition-all flex items-center justify-center space-x-1"
                    >
                      <span>Inspect Data & Controls</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>

                  </div>
                );
              })}
            </div>
          )}

    </div>
  );
};
