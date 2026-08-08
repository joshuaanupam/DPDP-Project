import React, { useState } from 'react';
import { X, FileText, Copy, Mail, CheckCircle2, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const Tier3LetterGenerator = () => {
  const { selectedWebsite, activeModal, closeModal, executeTier3Submit, userData } = usePrivacy();

  const [requestType, setRequestType] = useState('DATA_ERASURE'); // DATA_ERASURE (§12), CONSENT_REVOCATION (§6)
  const [customReason, setCustomReason] = useState('Personal data retention is no longer necessary for the purpose for which it was processed.');
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'TIER3' || !selectedWebsite) return null;

  const site = selectedWebsite;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Statutory DPDP Notice Text Generator
  const generateLetterText = () => {
    const isErasure = requestType === 'DATA_ERASURE';
    const section = isErasure ? 'Section 12 (Right to Erasure of Personal Data)' : 'Section 6(4) (Right to Withdraw Consent)';

    return `STATUTORY NOTICE UNDER THE DIGITAL PERSONAL DATA PROTECTION ACT, 2023

DATE: ${today}
TO: Data Protection Officer / Privacy Team (${site.name})
DOMAIN: ${site.domain}
RECIPIENT EMAIL: privacy@${site.domain}

FROM DATA PRINCIPAL:
Name: ${userData.name}
Registered Email: ${userData.email}

SUBJECT: FORMAL NOTICE FOR ${isErasure ? 'DATA ERASURE' : 'CONSENT WITHDRAWAL'} PURSUANT TO DPDP ACT 2023 ${section.toUpperCase()}

Dear Privacy Team,

I am writing as a Data Principal registered on your platform (${site.domain}). Pursuant to ${section} of the Digital Personal Data Protection (DPDP) Act, 2023, I hereby formally issue this notice to exercise my statutory rights:

${isErasure ? `1. DEMAND FOR ERASURE: I hereby instruct ${site.name} to permanently erase and purge all personal data relating to me across your primary servers, backup systems, and third-party data processors.
2. CESSATION OF PROCESSING: You are requested to cease all further processing of my personal data immediately upon receipt of this notice.` : `1. WITHDRAWAL OF CONSENT: I hereby withdraw all consents previously granted to ${site.name} regarding marketing communications, behavioral tracking, and data sharing.
2. REVISED CONSENT STATE: Please update your consent ledger to record all marketing permissions as REVOKED.`}

REASON / SPECIFIC INSTRUCTION:
"${customReason}"

STATUTORY TIMELINE:
Under DPDP Act regulations, Data Fiduciaries must execute valid Data Principal requests within the prescribed statutory timeframe and provide written confirmation of compliance.

Please confirm receipt of this notice and provide written verification once execution is completed.

Sincerely,
${userData.name}
(Data Principal)
Verification Ref: PL-DPDP-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const letterText = generateLetterText();

  const handleCopy = () => {
    navigator.clipboard.writeText(letterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailto = () => {
    const subject = encodeURIComponent(`[DPDP Statutory Notice] ${requestType === 'DATA_ERASURE' ? 'Data Erasure (§12)' : 'Consent Withdrawal (§6)'} - ${userData.name}`);
    const body = encodeURIComponent(letterText);
    window.open(`mailto:privacy@${site.domain}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSubmitRequest = () => {
    executeTier3Submit(site.id, requestType, letterText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl border border-violet-500/40 shadow-2xl shadow-violet-500/20 p-6 sm:p-8 text-left">
        
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 rounded-2xl bg-violet-500/20 border border-violet-500/40 text-violet-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-white">Tier 3 — DPDP Legal Notice Generator</h2>
            <p className="text-xs text-violet-300">Statutory Notice Generator for DPDP Act 2023 §6 & §12</p>
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Select DPDP Statutory Right</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-violet-500"
            >
              <option value="DATA_ERASURE" className="bg-[#131B2E]">DPDP §12 — Data Erasure & Account Purge</option>
              <option value="CONSENT_REVOCATION" className="bg-[#131B2E]">DPDP §6(4) — Statutory Consent Withdrawal</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Specific Instruction / Note</label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium"
              placeholder="Reason or instructions..."
            />
          </div>
        </div>

        {/* Generated Letter Preview Box */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-violet-400" /> Formatted DPDP Legal Notice Preview
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Recipient: privacy@{site.domain}</span>
          </div>

          <textarea
            readOnly
            value={letterText}
            rows={10}
            className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none resize-none leading-relaxed select-all"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center space-x-1.5 border border-slate-700"
            >
              <Copy className="w-3.5 h-3.5 text-violet-400" />
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Letter'}</span>
            </button>

            <button
              onClick={handleMailto}
              className="px-3.5 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 font-semibold text-xs transition-all flex items-center space-x-1.5 border border-violet-500/30"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Open Email Client</span>
            </button>
          </div>

          <button
            onClick={handleSubmitRequest}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Submit Request & Track Proof</span>
          </button>
        </div>

      </div>
    </div>
  );
};
