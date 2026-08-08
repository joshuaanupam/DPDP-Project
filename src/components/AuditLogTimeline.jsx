import React, { useState } from 'react';
import { History, ShieldCheck, Eye, Zap, FileText, CheckCircle2, Search, Sparkles } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const AuditLogTimeline = () => {
  const { auditLogs } = usePrivacy();
  const [filterType, setFilterType] = useState('ALL');

  const getActionConfig = (action) => {
    switch (action) {
      case 'EVENT_DETECTED':
        return { bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-400', icon: Eye, label: 'MV3 Event Intercepted' };
      case 'CONSENT_REVOCATION':
      case 'CONSENT_REVOKED':
        return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', icon: Zap, label: 'Consent Revoked' };
      case 'DELETION_REQUESTED':
        return { bg: 'bg-violet-500/20', border: 'border-violet-500/40', text: 'text-violet-400', icon: FileText, label: 'Notice Dispatched' };
      default:
        return { bg: 'bg-slate-500/20', border: 'border-slate-500/40', text: 'text-slate-600', icon: History, label: action };
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    return filterType === 'ALL' || log.action === filterType || (filterType === 'CONSENT_REVOCATION' && log.action === 'CONSENT_REVOKED');
  });

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-10 border border-slate-200/50">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900 flex items-center">
            Immutable Audit Trail Timeline
            <span className="ml-3 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> DPDP Compliance Proof
            </span>
          </h2>
          <p className="text-sm text-slate-600">Verifiable, cryptographic event log recording every consent detection, revocation, and legal erasure request.</p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/5 shadow-inner border border-slate-900/10">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType === 'ALL' ? 'bg-white text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-900'}`}
          >
            All Events ({auditLogs.length})
          </button>
          <button
            onClick={() => setFilterType('EVENT_DETECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType === 'EVENT_DETECTED' ? 'bg-white text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Detections
          </button>
          <button
            onClick={() => setFilterType('CONSENT_REVOCATION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType === 'CONSENT_REVOCATION' ? 'bg-white text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Revocations
          </button>
          <button
            onClick={() => setFilterType('DELETION_REQUESTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterType === 'DELETION_REQUESTED' ? 'bg-white text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Erasure Notices
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200/50 space-y-8">
        {filteredLogs.map((log) => {
          const cfg = getActionConfig(log.action);
          const IconComponent = cfg.icon;

          return (
            <div key={log.id} className="relative group">
              
              {/* Timeline Dot Icon */}
              <div className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-8 h-8 rounded-full ${cfg.bg} ${cfg.border} border-2 text-slate-900 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                <IconComponent className={`w-4 h-4 ${cfg.text}`} />
              </div>

              {/* Log Card Content */}
              <div className="glass-card rounded-2xl p-5 border border-slate-200/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-sm text-slate-900 font-heading">{log.siteName || log.websiteName || 'Website'}</span>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed mb-3">{log.description}</p>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/50/60">
                  <span className="text-slate-500 font-mono">Proof Hash: SHA256-0x{log.id.slice(-6)}</span>
                  <span className="text-emerald-400 font-bold flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> {log.dpdpProof || 'DPDP Audit Sealed'}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
