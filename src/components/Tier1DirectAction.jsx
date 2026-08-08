import React, { useState } from 'react';
import { X, Zap, CheckCircle2, RefreshCw, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const Tier1DirectAction = () => {
  const { selectedWebsite, activeModal, closeModal, actionTargetConsent, executeTier1Revoke } = usePrivacy();
  const [step, setStep] = useState('CONFIRM'); // 'CONFIRM', 'EXECUTING', 'DONE'

  if (activeModal !== 'TIER1' || !selectedWebsite) return null;

  const site = selectedWebsite;
  const targetConsent = actionTargetConsent || 'Marketing Emails';

  const handleStartExecute = () => {
    setStep('EXECUTING');
    setTimeout(() => {
      executeTier1Revoke(site.id, targetConsent);
      setStep('DONE');
    }, 1500);
  };

  const handleFinish = () => {
    setStep('CONFIRM');
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-indigo-500/40 shadow-2xl shadow-indigo-500/20 p-6 sm:p-8 text-left">
        
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 p-2 rounded-xl glass-card text-slate-600 hover:text-slate-900"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-900">Tier 1 — Direct Partner Revocation</h2>
            <p className="text-xs text-indigo-300">Automated Direct API Integration</p>
          </div>
        </div>

        {step === 'CONFIRM' && (
          <div>
            <div className="p-4 rounded-2xl glass-card border border-slate-200/50 mb-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-600">Target Website:</span>
                <span className="font-bold text-slate-900 font-mono">{site.name} ({site.domain})</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-600">Target Action:</span>
                <span className="font-bold text-amber-400">Revoke "{targetConsent}"</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">API Endpoint:</span>
                <span className="font-mono text-indigo-400">{site.directApiUrl || 'POST /api/partner/revoke'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mb-6">
              PrivacyLens will send a signed JWT payload directly to {site.name}'s backend partner API to execute consent revocation in real-time under DPDP §6(4).
            </p>

            <div className="flex items-center space-x-3">
              <button
                onClick={closeModal}
                className="w-1/3 py-2.5 rounded-xl glass-panel text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartExecute}
                className="w-2/3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Execute Direct API</span>
              </button>
            </div>
          </div>
        )}

        {step === 'EXECUTING' && (
          <div className="py-8 text-center">
            <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-4">
              <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin" />
              <Zap className="w-5 h-5 text-slate-900 absolute" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Communicating with Partner API</h3>
            <div className="space-y-1.5 text-xs text-slate-600 max-w-xs mx-auto text-left font-mono">
              <p className="text-indigo-400">✔ Authenticating JWT Token...</p>
              <p className="text-indigo-400">✔ Dispatching POST /api/partner/revoke...</p>
              <p className="text-slate-500 animate-pulse">⏳ Awaiting 200 OK Response...</p>
            </div>
          </div>
        )}

        {step === 'DONE' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Revocation Executed!</h3>
            <p className="text-xs text-slate-700 mb-4">
              "{targetConsent}" consent successfully revoked on {site.name}.
            </p>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6 flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium flex items-center">
                <Sparkles className="w-4 h-4 text-emerald-400 mr-1.5" /> Privacy Index Score Impact:
              </span>
              <span className="font-extrabold text-emerald-400 text-sm">+3 Points Boost</span>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-bold text-xs shadow-lg transition-all"
            >
              Done & View Audit Trail
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
