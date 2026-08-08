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

  const [isExpanded, setIsExpanded] = React.useState(false);

  // Only show websites that actually have shared/provided data items
  const websitesWithDetails = React.useMemo(() => {
    return filteredWebsites.filter(site => site.dataItems && site.dataItems.length > 0);
  }, [filteredWebsites]);

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'High':
        return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', label: 'High Risk' };
      case 'Medium':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Medium Risk' };
      case 'Low':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Low Risk' };
      default:
        return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-600', label: risk };
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 1:
        return { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', icon: Zap, label: 'Tier 1: Direct API' };
      case 2:
        return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: ExternalLink, label: 'Tier 2: Guided URL' };
      case 3:
        return { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', icon: FileText, label: 'Tier 3: Legal Notice' };
      default:
        return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-600', icon: FileText, label: `Tier ${tier}` };
    }
  };

  return (
    <div className="mb-10 glass-panel rounded-3xl p-6 border border-slate-200/50">
      
      {/* Clickable Header Section */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer py-2 group select-none transition-colors"
      >
        <div>
          <h2 className="text-2xl font-bold font-heading text-slate-900 flex items-center">
            Digital Footprint Overview
            <span className="ml-3 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {websitesWithDetails.length} Tracked Sites
            </span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">Discover shared personal data, active consents, and 3-Tier DPDP action paths.</p>
        </div>

        <div className="flex items-center space-x-2 text-slate-600 group-hover:text-indigo-400 transition-colors bg-slate-200/20 px-3 py-1.5 rounded-xl border border-slate-200/30">
          <span className="text-xs font-semibold">
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded ? (
        <div className="mt-8 pt-6 border-t border-slate-200/50 animate-fadeIn">
          
          {/* Controls bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-6">
            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px] sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search website, domain..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Risk Level Filter Dropdown */}
              <div className="flex items-center space-x-1 glass-panel p-1 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-600 ml-2 mr-1" />
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-2"
                >
                  <option value="ALL" className="bg-[#131B2E] text-slate-800">All Risks</option>
                  <option value="High" className="bg-[#131B2E] text-rose-400">High Risk</option>
                  <option value="Medium" className="bg-[#131B2E] text-amber-400">Medium Risk</option>
                  <option value="Low" className="bg-[#131B2E] text-emerald-400">Low Risk</option>
                </select>
              </div>

              {/* Tier Filter Dropdown */}
              <div className="flex items-center space-x-1 glass-panel p-1 rounded-xl">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer pr-2"
                >
                  <option value="ALL" className="bg-[#131B2E] text-slate-800">All Tiers</option>
                  <option value="1" className="bg-[#131B2E] text-indigo-400">Tier 1: Direct API</option>
                  <option value="2" className="bg-[#131B2E] text-cyan-400">Tier 2: Guided URL</option>
                  <option value="3" className="bg-[#131B2E] text-violet-400">Tier 3: Legal Notice</option>
                </select>
              </div>

            </div>
          </div>

          {/* Footprint Grid */}
          {websitesWithDetails.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-slate-200/50">
              <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No Tracked Websites Found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria or filter options.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {websitesWithDetails.map((site) => {
                const risk = getRiskBadge(site.riskLevel);
                const tier = getTierBadge(site.deletionTier);
                const TierIcon = tier.icon;

                const activeConsentsCount = site.consents.filter(c => c.status === 'ACTIVE').length;

                return (
                  <div
                    key={site.id}
                    className="glass-card rounded-2xl p-6 flex flex-col justify-between relative group border border-slate-200/50"
                  >
                    <div>
                      {/* Top Bar: Icon, Name & Badges */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-2xl glass-panel/90 border border-slate-200/50/80 flex items-center justify-center text-2xl shadow-inner">
                            {site.favicon || site.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-base text-slate-900 font-heading group-hover:text-indigo-400 transition-colors">
                              {site.name}
                            </h3>
                            <p className="text-xs text-slate-600 font-mono">{site.domain}</p>
                          </div>
                        </div>

                        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${risk.border} ${risk.bg} ${risk.text}`}>
                          {risk.label}
                        </span>
                      </div>

                      {/* Tier Badge & Category */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/50 text-xs">
                        <span className="text-slate-600 font-medium">{site.category}</span>
                        <span className={`flex items-center space-x-1 font-semibold px-2 py-0.5 rounded border ${tier.border} ${tier.bg} ${tier.text}`}>
                          <TierIcon className="w-3 h-3 mr-1" />
                          {tier.label}
                        </span>
                      </div>

                      {/* Shared Personal Data Items */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-slate-600 mb-2 flex items-center">
                          <Eye className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Shared Data Fields:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {site.dataItems.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-medium px-2 py-0.5 rounded-md glass-card text-slate-700 border border-slate-200/50"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Active Consents */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-600 font-medium">Active Permissions</span>
                          <span className="text-amber-400 font-bold">{activeConsentsCount} active</span>
                        </div>
                        <div className="w-full glass-panel rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-amber-400 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (activeConsentsCount / site.consents.length) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Inspect Action Trigger */}
                    <button
                      onClick={() => openDetailModal(site)}
                      className="w-full py-2.5 px-4 rounded-xl glass-card hover:bg-indigo-600/90 text-slate-800 hover:text-slate-900 font-semibold text-xs transition-all duration-200 flex items-center justify-center space-x-2 border border-slate-200/50/80 hover:border-indigo-500/50 group-hover:shadow-lg group-hover:shadow-indigo-500/10"
                    >
                      <span>Inspect Data & Controls</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        <div className="mt-4 p-4 text-center glass-panel rounded-2xl border border-dashed border-slate-200/40">
          <p className="text-xs font-semibold text-slate-600">
            Website footprint records and active consents are currently collapsed. Click on the heading above to expand.
          </p>
        </div>
      )}

    </div>
  );
};
