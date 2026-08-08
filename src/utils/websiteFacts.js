/**
 * @file websiteFacts.js
 * @description Strict Factual Mode engine for PrivacyLens AI Policy Summary.
 * Derives VERIFIED bullet points ONLY from each website's own stored data.
 * ZERO hallucination, ZERO generic sentences, ZERO cross-website data mixing.
 *
 * Rules:
 *  - Facts are derived ONLY from the exact selectedWebsite object.
 *  - Each bullet is 8–18 words maximum.
 *  - Returns 2–3 bullet points or the sentinel "VERIFIED INFORMATION NOT AVAILABLE".
 *  - Supports EN, HI, TE (exact factual translation, no added meaning).
 */

// ─── Translation dictionaries ────────────────────────────────────────────────

const LABELS = {
  collectsData: {
    EN: (items) => `Collects ${items} for registered account operations`,
    HI: (items) => `पंजीकृत खाता संचालन के लिए ${items} एकत्र करता है`,
    TE: (items) => `నమోదిత ఖాతా కార్యకలాపాల కోసం ${items} సేకరిస్తుంది`,
  },
  activeConsents: {
    EN: (types) => `Active consents include ${types}`,
    HI: (types) => `सक्रिय सहमतियों में ${types} शामिल हैं`,
    TE: (types) => `క్రియాశీల సమ్మతులలో ${types} ఉన్నాయి`,
  },
  revokedConsents: {
    EN: (types) => `Consent previously revoked: ${types}`,
    HI: (types) => `पहले रद्द की गई सहमति: ${types}`,
    TE: (types) => `గతంలో ఉపసంహరించిన సమ్మతి: ${types}`,
  },
  thirdPartySharing: {
    EN: () => `Shares behavioral or advertising data with third-party networks`,
    HI: () => `तृतीय-पक्ष नेटवर्क के साथ व्यवहारिक या विज्ञापन डेटा साझा करता है`,
    TE: () => `మూడవ పక్ష నెట్‌వర్క్‌లతో ప్రవర్తనా లేదా ప్రకటన డేటాను భాగస్వామ్యం చేస్తుంది`,
  },
  crossSiteTracking: {
    EN: () => `Enables cross-site behavioral tracking across platforms`,
    HI: () => `प्लेटफ़ॉर्म पर क्रॉस-साइट व्यवहारिक ट्रैकिंग सक्षम करता है`,
    TE: () => `వేదికలలో క్రాస్-సైట్ ప్రవర్తనా ట్రాకింగ్‌ను అనుమతిస్తుంది`,
  },
  dataBroker: {
    EN: () => `Shares user records with external data brokers`,
    HI: () => `बाहरी डेटा दलालों के साथ उपयोगकर्ता रिकॉर्ड साझा करता है`,
    TE: () => `బాహ్య డేటా బ్రోకర్లతో వినియోగదారు రికార్డులను భాగస్వామ్యం చేస్తుంది`,
  },
  kycFinancial: {
    EN: () => `Processes financial identity records under KYC regulations`,
    HI: () => `केवाईसी नियमों के तहत वित्तीय पहचान रिकॉर्ड संसाधित करता है`,
    TE: () => `కేవైసీ నిబంధనల ప్రకారం ఆర్థిక గుర్తింపు రికార్డులను ప్రాసెస్ చేస్తుంది`,
  },
  tier1: {
    EN: () => `Consent revocation available via direct partner API (Tier 1)`,
    HI: () => `सीधे पार्टनर एपीआई (टियर 1) के माध्यम से सहमति वापस लेना उपलब्ध है`,
    TE: () => `నేరుగా భాగస్వామి API (టైర్ 1) ద్వారా సమ్మతి ఉపసంహరణ అందుబాటులో ఉంది`,
  },
  tier2: {
    EN: () => `Self-serve guided privacy portal available for data removal`,
    HI: () => `डेटा हटाने के लिए स्व-सेवा निर्देशित गोपनीयता पोर्टल उपलब्ध है`,
    TE: () => `డేటా తొలగింపు కోసం సెల్ఫ్-సర్వ్ గైడెడ్ గోప్యతా పోర్టల్ అందుబాటులో ఉంది`,
  },
  tier3: {
    EN: () => `Data erasure requires formal DPDP §12 legal notice submission`,
    HI: () => `डेटा मिटाने के लिए औपचारिक डीपीडीपी §12 कानूनी नोटिस जमा करना आवश्यक है`,
    TE: () => `డేటా తొలగింపుకు అధికారిక DPDP §12 చట్టపరమైన నోటీసు సమర్పించాలి`,
  },
  marketingConsent: {
    EN: () => `Marketing and promotional communications consent is active`,
    HI: () => `विपणन और प्रचारात्मक संचार सहमति सक्रिय है`,
    TE: () => `మార్కెటింగ్ మరియు ప్రచారాత్మక కమ్యూనికేషన్ సమ్మతి క్రియాశీలంగా ఉంది`,
  },
  noSummary: {
    EN: () => `VERIFIED INFORMATION NOT AVAILABLE`,
    HI: () => `सत्यापित जानकारी उपलब्ध नहीं है`,
    TE: () => `ధృవీకరించిన సమాచారం అందుబాటులో లేదు`,
  },
};

// ─── Helper: format a list of items into comma-separated, max 3 shown ─────────
function formatList(items, maxItems = 3) {
  const slice = items.slice(0, maxItems);
  if (items.length > maxItems) {
    return slice.join(', ') + ' and others';
  }
  return slice.join(', ');
}

// ─── Core engine ─────────────────────────────────────────────────────────────

/**
 * Generates 2–3 strict factual bullet points for a website.
 * ALL facts are derived from the website object ONLY.
 *
 * @param {object} site - The exact selectedWebsite object from PrivacyContext
 * @param {'EN'|'HI'|'TE'} lang - Language code
 * @returns {{ bullets: string[], isAvailable: boolean }}
 */
export function generateVerifiedFacts(site, lang = 'EN') {
  if (!site || !site.domain) {
    return { bullets: [LABELS.noSummary[lang]()], isAvailable: false };
  }

  const L = lang; // shorthand
  const bullets = [];

  // ── Fact 1: What data is collected ───────────────────────────────────────
  if (site.dataItems && site.dataItems.length > 0) {
    const formattedItems = formatList(site.dataItems);
    bullets.push(LABELS.collectsData[L](formattedItems));
  }

  // ── Fact 2: Consent-based behavior signals (most specific wins) ───────────
  const consentTypes = (site.consents || []).map(c => (c.consentType || '').toLowerCase());
  const activeConsents = (site.consents || [])
    .filter(c => c.status === 'ACTIVE')
    .map(c => c.consentType);
  const revokedConsents = (site.consents || [])
    .filter(c => c.status === 'REVOKED')
    .map(c => c.consentType);

  const hasCrossSite = consentTypes.some(t => t.includes('cross-site') || t.includes('behavioral'));
  const hasDataBroker = consentTypes.some(t => t.includes('broker') || t.includes('data broker'));
  const hasThirdParty = consentTypes.some(t => t.includes('3rd-party') || t.includes('ad sharing') || t.includes('advertising'));
  const hasMarketing = consentTypes.some(t => t.includes('marketing') || t.includes('promotional'));
  const hasKyc = (site.dataItems || []).some(d => /pan|government id|bank|kyc|financial/i.test(d));

  if (hasDataBroker) {
    bullets.push(LABELS.dataBroker[L]());
  } else if (hasCrossSite) {
    bullets.push(LABELS.crossSiteTracking[L]());
  } else if (hasThirdParty) {
    bullets.push(LABELS.thirdPartySharing[L]());
  } else if (hasKyc) {
    bullets.push(LABELS.kycFinancial[L]());
  } else if (hasMarketing && activeConsents.length > 0) {
    bullets.push(LABELS.marketingConsent[L]());
  } else if (revokedConsents.length > 0) {
    bullets.push(LABELS.revokedConsents[L](formatList(revokedConsents, 2)));
  } else if (activeConsents.length > 0) {
    bullets.push(LABELS.activeConsents[L](formatList(activeConsents, 2)));
  }

  // ── Fact 3: Deletion/revocation mechanism (from tier — verified field) ────
  if (site.deletionTier === 1) {
    bullets.push(LABELS.tier1[L]());
  } else if (site.deletionTier === 2) {
    bullets.push(LABELS.tier2[L]());
  } else if (site.deletionTier === 3) {
    bullets.push(LABELS.tier3[L]());
  }

  // ── Guard: if no verified facts could be derived, return sentinel ─────────
  if (bullets.length === 0) {
    return { bullets: [LABELS.noSummary[L]()], isAvailable: false };
  }

  return { bullets: bullets.slice(0, 3), isAvailable: true };
}
