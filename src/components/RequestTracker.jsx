import React, { useState } from 'react';
import { Clock, CheckCircle2, Send, FileText, Zap, ExternalLink, Filter, Search, ShieldCheck } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const RequestTracker = () => {
  const { requests } = usePrivacy();
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, SUBMITTED, AWAITING_RESPONSE, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle2, label: 'COMPLETED' };
      case 'AWAITING_RESPONSE':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: Clock, label: 'AWAITING RESPONSE' };
      case 'SUBMITTED':
        return { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: Send, label: 'SUBMITTED' };
      default:
        return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', icon: Clock, label: status };
    }
  };

  const getTierMethodBadge = (method) => {
    switch (method) {
      case 'TIER1_DIRECT_API':
        return { text: 'text-indigo-400', icon: Zap, label: 'Tier 1 (Direct API)' };
      case 'TIER2_GUIDED_URL':
        return { text: 'text-cyan-400', icon: ExternalLink, label: 'Tier 2 (Guided Portal)' };
      case 'TIER3_GENERATED_NOTICE':
        return { text: 'text-violet-400', icon: FileText, label: 'Tier 3 (Legal Notice)' };
      default:
        return { text: 'text-slate-400', icon: FileText, label: method };
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const matchesSearch = req.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (req.referenceId && req.referenceId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-10 border border-slate-800">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center">
            Privacy Request Tracker
            <span className="ml-3 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {requests.length} Requests Recorded
            </span>
          </h2>
          <p className="text-sm text-slate-400">Track real-time status and legal statutory proof for consent revocations and data erasure requests.</p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search request ref, site..."
              className="pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs font-medium w-48"
            />
          </div>

          <div className="flex items-center space-x-1 glass-panel p-1 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-[#131B2E]">All Statuses</option>
              <option value="SUBMITTED" className="bg-[#131B2E] text-cyan-400">Submitted</option>
              <option value="AWAITING_RESPONSE" className="bg-[#131B2E] text-amber-400">Awaiting Response</option>
              <option value="COMPLETED" className="bg-[#131B2E] text-emerald-400">Completed</option>
            </select>
          </div>

        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Target Website</th>
              <th className="py-3 px-4">Request Type & Target</th>
              <th className="py-3 px-4">Action Method</th>
              <th className="py-3 px-4">Ref ID & Date</th>
              <th className="py-3 px-4">Status & Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                  No privacy requests match your filters.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => {
                const status = getStatusBadge(req.status);
                const method = getTierMethodBadge(req.methodUsed);
                const StatusIcon = status.icon;
                const MethodIcon = method.icon;

                return (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Website */}
                    <td className="py-4 px-4 font-medium text-white">
                      <div className="font-bold text-sm text-slate-100">{req.siteName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.domain}</div>
                    </td>

                    {/* Request Type */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-200 block">
                        {req.requestType === 'CONSENT_REVOCATION' ? 'Consent Revocation' : 'Data Erasure (§12)'}
                      </span>
                      <span className="text-[11px] text-indigo-300 font-medium">
                        Target: {req.targetConsent}
                      </span>
                    </td>

                    {/* Action Method */}
                    <td className="py-4 px-4">
                      <span className={`flex items-center space-x-1 font-semibold ${method.text}`}>
                        <MethodIcon className="w-3.5 h-3.5 mr-1" />
                        {method.label}
                      </span>
                    </td>

                    {/* Reference ID & Date */}
                    <td className="py-4 px-4">
                      <span className="font-mono text-slate-300 font-bold block">{req.referenceId || 'N/A'}</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    {/* Status Badge & Steps */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center space-x-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${status.border} ${status.bg} ${status.text}`}>
                        <StatusIcon className="w-3.5 h-3.5 mr-1" />
                        {status.label}
                      </span>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
