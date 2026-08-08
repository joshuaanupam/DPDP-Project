import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Zap, ExternalLink, FileText, Sparkles, Eye, CheckCircle2, AlertTriangle, ArrowRight, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';
import { generateVerifiedFacts } from '../utils/websiteFacts';

export const WebsiteDetailModal = () => {
  const {
    selectedWebsite,
    activeModal,
    closeModal,
    triggerTier1Revoke,
    triggerTier2Guided,
    triggerTier3Letter
  } = usePrivacy();

  const [aiLoading, setAiLoading] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN'); // 'EN', 'HI', 'TE'
  const [verifiedFacts, setVerifiedFacts] = useState({ bullets: [], isAvailable: false });

  // Guard: must be before any hook that depends on site
  if (activeModal !== 'DETAIL' || !selectedWebsite) return null;
  const site = selectedWebsite;

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'High':   return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'Medium': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default:       return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
  };

  // Re-derive facts whenever site or language changes
  const handleGenerateAiSummary = () => {
    setAiLoading(true);
    // Simulate brief AI "analysis" delay then derive facts from site data
    setTimeout(() => {
      const result = generateVerifiedFacts(site, selectedLanguage);
      setVerifiedFacts(result);
      setAiLoading(false);
      setShowAiSummary(true);
    }, 700);
  };

  // Regenerate in-place when user switches language (if summary already shown)
  const handleLanguageSwitch = (lang) => {
    setSelectedLanguage(lang);
    if (showAiSummary) {
      const result = generateVerifiedFacts(site, lang);
      setVerifiedFacts(result);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl border border-slate-200/50/80 shadow-2xl p-6 sm:p-8 text-left">
        
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 p-2 rounded-xl glass-card text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-14 h-14 rounded-2xl glass-panel border border-slate-200/50 flex items-center justify-center text-3xl shadow-inner">
            {site.favicon || site.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold font-heading text-slate-900">{site.name}</h2>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${getRiskBadge(site.riskLevel)}`}>
                {site.riskLevel} Risk
              </span>
            </div>
            <p className="text-xs text-slate-600 font-mono mt-0.5">{site.domain} • {site.category}</p>
          </div>
        </div>

        {/* Section 1: Shared Personal Data Fields */}
        <div className="mb-6 p-4 rounded-2xl glass-card border border-slate-200/50">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
            <Eye className="w-4 h-4 mr-1.5 text-indigo-400" /> Tracked Personal Data Fields
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {site.dataItems.map((item, i) => (
              <div key={i} className="flex items-center space-x-2 p-2 rounded-xl glass-card border border-slate-200/50 text-xs font-medium text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Active Consents & Instant Controls */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
            <Lock className="w-4 h-4 mr-1.5 text-amber-400" /> Active Consents & Controls
          </h3>
          <div className="space-y-2.5">
            {site.consents.map((consent) => {
              const isRevoked = consent.status === 'REVOKED';
              return (
                <div
                  key={consent.id}
                  className="flex items-center justify-between p-3.5 rounded-xl glass-panel/40 border border-slate-200/50/60"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{consent.consentType}</p>
                    <p className="text-[11px] text-slate-600">
                      Granted: {new Date(consent.grantedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {isRevoked ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> REVOKED
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (site.deletionTier === 1) {
                          triggerTier1Revoke(site, consent.consentType);
                        } else {
                          triggerTier3Letter(site, 'CONSENT_REVOCATION');
                        }
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all flex items-center space-x-1"
                    >
                      <span>Revoke Consent</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: AI Policy Summarizer — Strict Factual Mode */}
        <div className="mb-6 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-200">Plain-Language AI Policy Summary</span>
            </div>

            {/* Language switcher — always visible once summary is shown */}
            {showAiSummary && (
              <div className="flex items-center space-x-1 bg-indigo-900/40 p-0.5 rounded-lg border border-indigo-500/25 text-[10px] font-bold">
                {['EN', 'HI', 'TE'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSwitch(lang)}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      selectedLanguage === lang
                        ? 'bg-indigo-600 text-white'
                        : 'text-indigo-200 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}

            {/* Summarize button — only shown before summary is generated */}
            {!showAiSummary && (
              <button
                onClick={handleGenerateAiSummary}
                disabled={aiLoading}
                className="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center space-x-1 disabled:opacity-60"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>✨ Summarize Terms</span>
                )}
              </button>
            )}
          </div>

          {/* Summary output */}
          {showAiSummary ? (
            <div className="mt-3 bg-indigo-900/20 p-3 rounded-xl border border-indigo-500/20">

              {/* Strict Factual Mode badge */}
              <div className="flex items-center space-x-1.5 mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Strict Factual Mode — {site.name} ({site.domain}) only
                </span>
              </div>

              {/* Verified bullet points */}
              {verifiedFacts.isAvailable ? (
                <ul className="space-y-2">
                  {verifiedFacts.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs text-indigo-100/90 leading-relaxed">
                      <span className="text-indigo-400 font-bold mt-0.5 shrink-0">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs font-bold text-amber-400 tracking-wide">
                  {verifiedFacts.bullets[0]}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Click <span className="font-semibold text-indigo-300">Summarize Terms</span> to get verified factual bullet points about <span className="font-semibold">{site.name}</span>.
            </p>
          )}
        </div>

        {/* Section 4: 3-Tier Privacy Action Center */}
        <div className="pt-4 border-t border-slate-200/50">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
            DPDP Rights & Deletion Engine
          </h3>

          {site.deletionTier === 1 && (
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider block">
                  ⚡ Tier 1: Direct Partner API Available
                </span>
                <p className="text-xs text-slate-700 mt-0.5">
                  {site.name} supports instant direct API execution to revoke consents or delete accounts.
                </p>
              </div>
              <button
                onClick={() => triggerTier1Revoke(site, 'All Consents')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1.5 shrink-0"
              >
                <Zap className="w-4 h-4" />
                <span>Execute Direct Revoke</span>
              </button>
            </div>
          )}

          {site.deletionTier === 2 && (
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider block">
                  🔗 Tier 2: Guided Deletion Portal
                </span>
                <p className="text-xs text-slate-700 mt-0.5">
                  Direct link to {site.name}'s official settings deletion flow with step-by-step guidance.
                </p>
              </div>
              <button
                onClick={() => triggerTier2Guided(site)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center space-x-1.5 shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Guided Portal</span>
              </button>
            </div>
          )}

          {site.deletionTier === 3 && (
            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-violet-400 uppercase tracking-wider block">
                  📜 Tier 3: DPDP Legal Notice Generator
                </span>
                <p className="text-xs text-slate-700 mt-0.5">
                  Generate statutory DPDP §12 Erasure or §6 Withdrawal notices with proof tracking.
                </p>
              </div>
              <button
                onClick={() => triggerTier3Letter(site, 'DATA_ERASURE')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center space-x-1.5 shrink-0"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Legal Letter</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
