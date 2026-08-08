import React, { useState } from 'react';
import { X, ShieldAlert, Zap, ExternalLink, FileText, Sparkles, Eye, CheckCircle2, AlertTriangle, ArrowRight, Lock, RefreshCw } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

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

  const translations = {
    web_shopease: {
      EN: {
        summary: "ShopEase collects name, contact details, and purchase records. They share browsing behavior with 3rd-party ad networks. Marketing and advertising consents can be directly revoked via Tier 1 API.",
        b1: "Data stored in domestic & cloud data centers.",
        b2: "DPDP §6 withdrawal available via privacy rights officer."
      },
      HI: {
        summary: "शॉपईज़ नाम, संपर्क विवरण और खरीद रिकॉर्ड एकत्र करता है। वे ब्राउज़िंग व्यवहार को तीसरे पक्ष के विज्ञापन नेटवर्क के साथ साझा करते हैं। विपणन और विज्ञापन सहमति को सीधे टियर 1 एपीआई के माध्यम से रद्द किया जा सकता है।",
        b1: "डेटा घरेलू और क्लाउड डेटा केंद्रों में संग्रहीत है।",
        b2: "गोपनीयता अधिकार अधिकारी के माध्यम से डीपीडीपी धारा 6 के तहत सहमति वापस लेना उपलब्ध है।"
      },
      TE: {
        summary: "షాప్‌ఈజ్ పేరు, సంప్రదింపు వివరాలు మరియు కొనుగోలు రికార్డులను సేకరిస్తుంది. వారు బ్రౌజింగ్ ప్రవర్తనను 3వ పక్ష ప్రకటన నెట్‌వర్క్‌లతో పంచుకుంటారు. మార్కెటింగ్ మరియు ప్రకటనల సమ్మతిని నేరుగా టైర్ 1 API ద్వారా ఉపసంహరించుకోవచ్చు.",
        b1: "డేటా దేశీయ మరియు క్లౌడ్ డేటా కేంద్రాలలో నిల్వ చేయబడుతుంది.",
        b2: "గోప్యతా హక్కుల అధికారి ద్వారా DPDP §6 సమ్మతి ఉపసంహరణ అందుబాటులో ఉంది."
      }
    },
    web_dataflow: {
      EN: {
        summary: "DataFlow Analytics aggregates user telemetry and location profiles across web networks. Retains data for 3 years and shares with ad exchanges. Requires a formal DPDP §12 legal erasure notice.",
        b1: "Data stored in domestic & cloud data centers.",
        b2: "DPDP §6 withdrawal available via privacy rights officer."
      },
      HI: {
        summary: "डेटाफ्लो एनालिटिक्स वेब नेटवर्क पर उपयोगकर्ता टेलीमेट्री और स्थान प्रोफाइल को एकत्र करता है। डेटा को 3 वर्षों के लिए रखता है और विज्ञापन एक्सचेंजों के साथ साझा करता है। इसके लिए एक औपचारिक डीपीडीपी धारा 12 कानूनी विलोपन नोटिस की आवश्यकता होती है।",
        b1: "डेटा घरेलू और क्लाउड डेटा केंद्रों में संग्रहीत है।",
        b2: "गोपनीयता अधिकार अधिकारी के माध्यम से डीपीडीपी धारा 6 के तहत सहमति वापस लेना उपलब्ध है।"
      },
      TE: {
        summary: "డేటాఫ్లో అనలిటిక్స్ వెబ్ నెట్‌వర్క్‌లలో వినియోగదారు టెలిమెట్రీ మరియు స్థాన ప్రొఫైల్‌లను సేకరిస్తుంది. డేటాను 3 సంవత్సరాల పాటు నిల్వ ఉంచుతుంది మరియు ప్రకటన ఎక్స్ఛేంజ్‌లతో భాగస్వామ్యం చేస్తుంది. దీనికి అధికారిక DPDP §12 చట్టపరమైన డేటా తొలగింపు నోటీసు అవసరం.",
        b1: "డేటా దేశీయ మరియు క్లౌడ్ డేటా కేంద్రాలలో నిల్వ చేయబడుతుంది.",
        b2: "గోప్యతా హక్కుల అధికారి ద్వారా DPDP §6 సమ్మతి ఉపసంహరణ అందుబాటులో ఉంది."
      }
    },
    web_socialpulse: {
      EN: {
        summary: "SocialPulse processes personal interactions to build content recommendations. Provides a self-serve guided deletion portal for account and data removal.",
        b1: "Data stored in domestic & cloud data centers.",
        b2: "DPDP §6 withdrawal available via privacy rights officer."
      },
      HI: {
        summary: "सोशलपल्स सामग्री अनुशंसाओं के निर्माण के लिए व्यक्तिगत अंतःक्रियाओं को संसाधित करता है। खाता और डेटा हटाने के लिए एक स्व-सेवा निर्देशित विलोपन पोर्टल प्रदान करता है।",
        b1: "डेटा घरेलू और क्लाउड डेटा केंद्रों में संग्रहीत है।",
        b2: "गोपनीयता अधिकार अधिकारी के माध्यम से डीपीडीपी धारा 6 के तहत सहमति वापस लेना उपलब्ध है।"
      },
      TE: {
        summary: "సోషల్ పల్స్ కంటెంట్ సిఫార్సులను రూపొందించడానికి వ్యక్తిగత పరస్పర చర్యలను ప్రాసెస్ చేస్తుంది. ఖాతా మరియు డేటా తొలగింపు కోసం సెల్ఫ్-సర్వ్ గైడెడ్ తొలగింపు పోర్టల్‌ను అందిస్తుంది.",
        b1: "డేటా దేశీయ మరియు క్లౌడ్ డేటా కేంద్రాలలో నిల్వ చేయబడుతుంది.",
        b2: "గోప్యతా హక్కుల అధికారి ద్వారా DPDP §6 సమ్మతి ఉపసంహరణ అందుబాటులో ఉంది."
      }
    },
    web_streamhub: {
      EN: {
        summary: "StreamHub retains watch history and billing info to maintain active subscription services. Does not share data with 3rd party brokers.",
        b1: "Data stored in domestic & cloud data centers.",
        b2: "DPDP §6 withdrawal available via privacy rights officer."
      },
      HI: {
        summary: "स्ट्रीमहब सक्रिय सदस्यता सेवाओं को बनाए रखने के लिए देखने के इतिहास और बिलिंग जानकारी को रखता है। तीसरे पक्ष के दलालों के साथ डेटा साझा नहीं करता है।",
        b1: "डेटा घरेलू और क्लाउड डेटा केंद्रों में संग्रहीत है।",
        b2: "गोपनीयता अधिकार अधिकारी के माध्यम से डीपीडीपी धारा 6 के तहत सहमति वापस लेना उपलब्ध है।"
      },
      TE: {
        summary: "సక్రియ సభ్యత్వ సేవలను నిర్వహించడానికి స్ట్రీమ్‌హబ్ వీక్షణ చరిత్రను మరియు బిల్లింగ్ సమాచారాన్ని ఉంచుతుంది. 3వ పక్ష బ్రోకర్లతో డేటాను భాగస్వామ్యం చేయదు.",
        b1: "డేటా దేశీయ మరియు క్లౌడ్ డేటా కేంద్రాలలో నిల్వ చేయబడుతుంది.",
        b2: "గోప్యతా హక్కుల అధికారి ద్వారా DPDP §6 సమ్మతి ఉపసంహరణ అందుబాటులో ఉంది."
      }
    },
    web_cloudspace: {
      EN: {
        summary: "CloudSpace stores encrypted files and user logs. Guided self-serve privacy controls enable downloading archives or requesting account closure.",
        b1: "Data stored in domestic & cloud data centers.",
        b2: "DPDP §6 withdrawal available via privacy rights officer."
      },
      HI: {
        summary: "क्लाउडस्पेस एन्क्रिप्टेड फ़ाइलें और उपयोगकर्ता लॉग संग्रहीत करता है। निर्देशित स्व-सेवा गोपनीयता नियंत्रण अभिलेखागार डाउनलोड करने या खाता बंद करने का अनुरोध करने में सक्षम बनाते हैं।",
        b1: "डेटा घरेलू और क्लाउड डेटा केंद्रों में संग्रहीत है।",
        b2: "गोपनीयता अधिकार अधिकारी के माध्यम से डीपीडीपी धारा 6 के तहत सहमति वापस लेना उपलब्ध है।"
      },
      TE: {
        summary: "క్లౌడ్‌స్పేస్ గుప్తీకరించిన (ఎన్‌క్రిప్ట్) ఫైల్‌లను మరియు వినియోగదారు లాగ్‌లను నిల్వ చేస్తుంది. గైడెడ్ సెల్ఫ్-సర్వ్ గోప్యతా నియంత్రణలు ఆర్కైవ్‌లను డౌన్‌లోడ్ చేయడానికి లేదా ఖాతా ముగింపును అభ్యర్థించడానికి వీలు కల్పిస్తాయి.",
        b1: "డేటా దేశీయ మరియు క్లౌడ్ డేటా కేంద్రాలలో నిల్వ చేయబడుతుంది.",
        b2: "గోప్యతా హక్కుల అధికారి ద్వారా DPDP §6 సమ్మతి ఉపసంహరణ అందుబాటులో ఉంది."
      }
    },
    web_fintechx: {
      EN: {
        summary: "FinTechX processes financial identity records under KYC regulations. Marketing opt-outs and data erasure require formal DPDP legal notices.",
        b1: "Data stored in domestic & cloud data centers.",
        b2: "DPDP §6 withdrawal available via privacy rights officer."
      },
      HI: {
        summary: "फिनटेकएक्स केवाईसी नियमों के तहत वित्तीय पहचान रिकॉर्ड को संसाधित करता है। विपणन ऑप्ट-आउट और डेटा विलोपन के लिए औपचारिक डीपीडीपी कानूनी नोटिस की आवश्यकता होती है।",
        b1: "डेटा घरेलू और क्लाउड डेटा केंद्रों में संग्रहीत है।",
        b2: "गोपनीयता अधिकार अधिकारी के माध्यम से डीपीडीपी धारा 6 के तहत सहमति वापस लेना उपलब्ध है।"
      },
      TE: {
        summary: "ఫిన్‌టెక్స్ కేవైసీ (KYC) నిబంధనల ప్రకారం ఆర్థిక గుర్తింపు రికార్డులను ప్రాసెస్ చేస్తుంది. మార్కెటింగ్ నిలిపివేత మరియు డేటా తొలగింపు కోసం అధికారిక DPDP చట్టపరమైన నోటీసులు అవసరం.",
        b1: "డేటా దేశీయ మరియు క్లౌడ్ డేటా కేంద్రాలలో నిల్వ చేయబడుతుంది.",
        b2: "గోప్యతా హక్కుల అధికారి ద్వారా DPDP §6 సమ్మతి ఉపసంహరణ అందుబాటులో ఉంది."
      }
    }
  };

  // Guard: must be before any function that uses `site`
  if (activeModal !== 'DETAIL' || !selectedWebsite) return null;
  const site = selectedWebsite;

  const getTranslatedSummary = () => {
    if (translations[site.id]) {
      return translations[site.id][selectedLanguage];
    }
    return {
      summary: site.aiSummary || "AI Summary not generated yet.",
      b1: "Data stored in domestic & cloud data centers.",
      b2: "DPDP §6 withdrawal available via privacy rights officer."
    };
  };

  const activeTranslation = getTranslatedSummary();



  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'High': return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      case 'Medium': return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default: return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
  };

  const handleGenerateAiSummary = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiLoading(false);
      setShowAiSummary(true);
    }, 800);
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

        {/* Section 3: AI Policy Summarizer */}
        <div className="mb-6 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-200">Plain-Language AI Policy Summary</span>
            </div>
            
            {showAiSummary && (
              <div className="flex items-center space-x-1 bg-indigo-900/40 p-0.5 rounded-lg border border-indigo-500/25 text-[10px] font-bold">
                {['EN', 'HI', 'TE'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      selectedLanguage === lang 
                        ? 'bg-indigo-600 text-slate-900' 
                        : 'text-indigo-200 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}

            {!showAiSummary && (
              <button
                onClick={handleGenerateAiSummary}
                disabled={aiLoading}
                className="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-900 transition-all flex items-center space-x-1"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    <span>Analyzing Terms...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Summarize Terms</span>
                  </>
                )}
              </button>
            )}
          </div>

          {showAiSummary ? (
            <div className="mt-3 text-xs text-indigo-100/90 leading-relaxed font-sans bg-indigo-900/20 p-3 rounded-xl border border-indigo-500/20">
              <p className="font-medium text-slate-800 mb-2">{activeTranslation.summary}</p>
              <ul className="space-y-1 text-slate-700 pl-4 list-disc">
                <li>{activeTranslation.b1}</li>
                <li>{activeTranslation.b2}</li>
              </ul>
            </div>
          ) : (
            <p className="text-xs text-slate-600">Click summarize to get a 2-sentence plain English breakdown of {site.name}'s legal policy.</p>
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
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-1.5 shrink-0"
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
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center space-x-1.5 shrink-0"
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
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-slate-900 font-bold text-xs shadow-lg shadow-violet-600/30 transition-all flex items-center justify-center space-x-1.5 shrink-0"
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
