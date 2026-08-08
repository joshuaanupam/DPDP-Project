import React, { useState } from 'react';
import { X, ExternalLink, CheckCircle2, ArrowRight, ShieldCheck, Compass, Info } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const Tier2GuidedAction = () => {
  const { selectedWebsite, activeModal, closeModal, executeTier2Initiate } = usePrivacy();

  if (activeModal !== 'TIER2' || !selectedWebsite) return null;

  const site = selectedWebsite;
  const guidedUrl = site.guidedUrl || `https://${site.domain}/account/privacy`;

  const handleConfirmInitiate = () => {
    executeTier2Initiate(site.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 p-6 sm:p-8 text-left">
        
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-white">Tier 2 — Guided Deletion Flow</h2>
            <p className="text-xs text-cyan-300">Direct Self-Serve Privacy URL</p>
          </div>
        </div>

        {/* Steps Guidance */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-xs font-bold text-white">Open Official Deletion Page</p>
              <p className="text-[11px] text-slate-400">Click below to launch {site.name}'s verified privacy settings page.</p>
              <a
                href={guidedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 mt-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors"
              >
                <span>Navigate to {site.domain}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-xs font-bold text-white">Log into Your Account</p>
              <p className="text-[11px] text-slate-400">Authenticate on {site.name} if prompted to verify account ownership.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="text-xs font-bold text-white">Submit Deletion Request & Log Proof</p>
              <p className="text-[11px] text-slate-400">Confirm request on site, then click below to add to PrivacyLens Request Tracker.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={closeModal}
            className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmInitiate}
            className="w-2/3 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark as Initiated & Track</span>
          </button>
        </div>

      </div>
    </div>
  );
};
