import React, { useState } from 'react';
import { X, FileText, Copy, Mail, CheckCircle2, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const Tier3LetterGenerator = () => {
  const { selectedWebsite, activeModal, closeModal, executeTier3Submit, userData } = usePrivacy();

  const [requestType, setRequestType] = useState('DATA_ERASURE'); // DATA_ERASURE (§12), CONSENT_REVOCATION (§6)
  const [language, setLanguage] = useState('EN'); // 'EN', 'HI', 'TE'
  const [customReason, setCustomReason] = useState('Personal data retention is no longer necessary for the purpose for which it was processed.');
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'TIER3' || !selectedWebsite) return null;

  const site = selectedWebsite;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Statutory DPDP Notice Text Generator
  const generateLetterText = () => {
    const isErasure = requestType === 'DATA_ERASURE';

    if (language === 'HI') {
      const section = isErasure ? 'धारा १२ (डेटा मिटाने का अधिकार)' : 'धारा ६(४) (सहमति वापस लेने का अधिकार)';
      return `डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) अधिनियम, 2023 के तहत वैधानिक नोटिस

दिनांक: ${today}
प्रेषित: डेटा संरक्षण अधिकारी / प्राइवेसी टीम (${site.name})
डोमेन: ${site.domain}
ईमेल: privacy@${site.domain}

डेटा प्रिंसिपल से:
नाम: ${userData.name}
पंजीकृत ईमेल: ${userData.email}

विषय: DPDP अधिनियम 2023 ${section.toUpperCase()} के तहत ${isErasure ? 'डेटा मिटाने' : 'सहमति वापस लेने'} का औपचारिक नोटिस

प्रिय प्राइवेसी टीम,
मैं आपके प्लेटफॉर्म (${site.domain}) पर पंजीकृत एक डेटा प्रिंसिपल के रूप में लिख रहा हूं। डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) अधिनियम, 2023 की ${section} के अनुसार, मैं इसके द्वारा औपचारिक रूप से अपने अधिकारों का प्रयोग करता हूं:

${isErasure ? `1. डेटा मिटाने की मांग: मैं इसके द्वारा ${site.name} को निर्देश देता हूं कि मेरे से संबंधित सभी व्यक्तिगत डेटा को आपके सर्वर, बैकअप सिस्टम और तीसरे पक्ष के डेटा प्रोसेसर से स्थायी रूप से मिटा दिया जाए।
2. प्रोसेसिंग पर रोक: आपसे अनुरोध है कि इस नोटिस की प्राप्ति के तुरंत बाद मेरे व्यक्तिगत डेटा की सभी प्रोसेसिंग को बंद कर दिया जाए।` : `1. सहमति वापस लेना: मैं इसके द्वारा ${site.name} को दी गई विपणन संचार, ट्रैकिंग और डेटा साझाकरण की सहमति वापस लेता हूं।
2. संशोधित सहमति स्थिति: कृपया अपने सहमति रिकॉर्ड को अपडेट करें और सभी विपणन अनुमतियों को वापस लिया हुआ दर्ज करें।`}

विशिष्ट निर्देश / कारण:
"${customReason}"

वैधानिक समय-सीमा:
DPDP अधिनियम के नियमों के अनुसार, डेटा फिड्यूशरीज़ को वैधानिक समय-सीमा के भीतर अनुरोधों को निष्पादित करना होगा और अनुपालन की लिखित पुष्टि प्रदान करनी होगी।

कृपया इस नोटिस की प्राप्ति की पुष्टि करें।

भवदीय,
${userData.name}
(डेटा प्रिंसिपल)
संदर्भ संख्या: PL-DPDP-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    if (language === 'TE') {
      const section = isErasure ? 'సెక్షన్ 12 (డేటా తొలగింపు హక్కు)' : 'సెక్షన్ 6(4) (సమ్మతి ఉపసంహరణ హక్కు)';
      return `డిజిటల్ వ్యక్తిగత డేటా రక్షణ (DPDP) చట్టం, 2023 కింద చట్టబద్ధమైన నోటీసు

తేదీ: ${today}
స్వీకర్త: డేటా రక్షణ అధికారి / గోప్యతా బృందం (${site.name})
డొమైన్: ${site.domain}
ఈమెయిల్: privacy@${site.domain}

డేటా ప్రిన్సిపాల్ నుండి:
పేరు: ${userData.name}
నమోదిత ఈమెయిల్: ${userData.email}

విషయం: DPDP చట్టం 2023 ${section.toUpperCase()} కింద ${isErasure ? 'డేటా తొలగింపు' : 'సమ్మతి ఉపసంహరణ'} కొరకు నోటీసు

ప్రియమైన గోప్యతా బృందం,
నేను మీ ప్లాట్‌ఫారమ్ (${site.domain}) లో నమోదైన డేటా ప్రిన్సిపాల్‌గా వ్రాస్తున్నాను. డిజిటల్ వ్యక్తిగత డేటా రక్షణ (DPDP) చట్టం, 2023 యొక్క ${section} ప్రకారం, నా హక్కులను ఉపయోగించుకుంటున్నాను:

${isErasure ? `1. డేటా తొలగింపు: నా వ్యక్తిగత డేటాను మీ సర్వర్లు మరియు థర్డ్ పార్టీ ప్రాసెసర్ల నుండి శాశ్వతంగా తొలగించాల్సిందిగా ${site.name} ని కోరుతున్నాను.
2. ప్రాసెసింగ్ నిలిపివేత: ఈ నోటీసు అందిన వెంటనే నా వ్యక్తిగత డేటా ప్రాసెసింగ్ నిలిపివేయవలసిందిగా కోరుతున్నాను.` : `1. సమ్మతి ఉపసంహరణ: మార్కెటింగ్, ప్రకటనల కోసం నేను గతంలో ${site.name} కి ఇచ్చిన అన్ని సమ్మతులను ఉపసంహరించుకుంటున్నాను.
2. సమ్మతి స్థితి మార్పు: దయచేసి మీ రికార్డులను అప్‌డేట్ చేసి, నా సమ్మతిని ఉపసంహరించినట్లు నమోదు చేయండి.`}

గోప్యతా సూచనలు:
"${customReason}"

చట్టబద్ధమైన గడువు:
DPDP చట్టం నిబంధనల ప్రకారం, నిర్ణీత గడువులోగా ఈ అభ్యర్థనను అమలు చేసి, మాకు రాతపూర్వక ధ్రువీకరణ ఇవ్వాల్సి ఉంటుంది.

స్వీకరణను ధ్రువీకరించండి.

భవదీయుడు,
${userData.name}
(డేటా ప్రిన్సిపాల్)
రెఫరెన్స్ సంఖ్య: PL-DPDP-${Math.floor(100000 + Math.random() * 900000)}`;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel rounded-3xl border border-violet-500/40 shadow-2xl shadow-violet-500/20 p-6 sm:p-8 text-left">
        
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 p-2 rounded-xl glass-card text-slate-600 hover:text-slate-900"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-3 rounded-2xl bg-violet-500/20 border border-violet-500/40 text-violet-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-900">Tier 3 — DPDP Legal Notice Generator</h2>
            <p className="text-xs text-violet-300">Statutory Notice Generator for DPDP Act 2023 §6 & §12</p>
          </div>
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Select DPDP Right</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-violet-500"
            >
              <option value="DATA_ERASURE" className="bg-[#131B2E]">DPDP §12 — Data Erasure</option>
              <option value="CONSENT_REVOCATION" className="bg-[#131B2E]">DPDP §6(4) — Consent Withdrawal</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notice Language (§5(3))</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-violet-500"
            >
              <option value="EN" className="bg-[#131B2E]">English (EN)</option>
              <option value="HI" className="bg-[#131B2E]">हिन्दी (HI)</option>
              <option value="TE" className="bg-[#131B2E]">తెలుగు (TE)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Instruction / Note</label>
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
            <span className="text-xs font-bold text-slate-700 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-violet-400" /> Formatted DPDP Legal Notice Preview
            </span>
            <span className="text-[11px] text-slate-600 font-mono">Recipient: privacy@{site.domain}</span>
          </div>

          <textarea
            readOnly
            value={letterText}
            rows={10}
            className="w-full p-4 rounded-2xl glass-panel border border-slate-200/50 text-xs font-mono text-slate-700 focus:outline-none resize-none leading-relaxed select-all"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/50">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl glass-panel hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-all flex items-center space-x-1.5 border border-slate-200/50"
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
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-slate-900 font-bold text-xs shadow-lg shadow-violet-600/30 transition-all flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Submit Request & Track Proof</span>
          </button>
        </div>

      </div>
    </div>
  );
};
