/**
 * @file aiService.js
 * @description PrivacyLens AI Intelligence Service powered by Google Gemini API
 * with multi-language support (Hindi/Telugu) and deterministic rule-based fallbacks.
 * Owned by: TM1 (Project Lead & AI Intelligence Engineer)
 */

const https = require('https');

// Fallback configuration
const DEFAULT_TIMEOUT_MS = 6000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Pre-translated standard fallbacks for Hindi (§5(3) + §6(3) support)
const HINDI_FALLBACKS = {
  highRisk: {
    bullet1: "यह वेबसाइट आपकी व्यक्तिगत संपर्क जानकारी, स्थान और वित्तीय विवरण एकत्र करती है और इसे तीसरे पक्ष के विज्ञापनदाताओं के साथ साझा करती है।",
    bullet2: "डेटा को अनिश्चित काल तक बनाए रखा जाता है; आप किसी भी समय सहमति वापस लेने या डेटा हटाने (Erasure) के लिए अनुरोध कर सकते हैं।"
  },
  medRisk: {
    bullet1: "यह वेबसाइट सेवा वितरण को अनुकूलित करने के लिए आपके खाते की साख और उपयोग विश्लेषण विवरणों को ट्रैक करती है।",
    bullet2: "आप कानून के तहत किसी भी समय अपनी सहमति वापस ले सकते हैं या डेटा हटाने का अनुरोध कर सकते हैं।"
  },
  lowRisk: {
    bullet1: "यह वेबसाइट केवल सेवा वितरण के लिए आवश्यक न्यूनतम व्यक्तिगत क्रेडेंशियल एकत्र करती है।",
    bullet2: "डीपीडीपी अधिनियम (DPDP Act) के तहत सहमति वापस लेने और रिकॉर्ड हटाने के अधिकार सुरक्षित हैं।"
  }
};

// Pre-translated standard fallbacks for Telugu (§5(3) + §6(3) support)
const TELUGU_FALLBACKS = {
  highRisk: {
    bullet1: "ఈ వెబ్‌సైట్ మీ వ్యక్తిగత సంప్రదింపు సమాచారం, స్థానం మరియు ఆర్థిక వివరాలను సేకరిస్తుంది మరియు దీనిని మూడవ పక్ష ప్రకటనదారులతో భాగస్వామ్యం చేస్తుంది.",
    bullet2: "డేటా నిరవధికంగా నిలుపుకోబడుతుంది; మీరు ఏ సమయంలోనైనా సమ్మతిని ఉపసంహరించుకోవచ్చు లేదా డేటా తొలగింపును అభ్యర్థించవచ్చు."
  },
  medRisk: {
    bullet1: "ఈ వెబ్‌సైట్ సేవా పంపిణీని మెరుగుపరచడానికి మీ ఖాతా ఆధారాలను మరియు వినియోగ విశ్లేషణల వివరాలను ట్రాక్ చేస్తుంది.",
    bullet2: "మీరు చట్టం ప్రకారం ఏ సమయంలోనైనా మీ సమ్మతిని ఉపసంహరించుకోవచ్చు లేదా డేటా తొలగింపును అభ్యర్థించవచ్చు."
  },
  lowRisk: {
    bullet1: "ఈ వెబ్‌సైట్ సేవా పంపిణీకి అవసరమైన కనీస వ్యక్తిగత ఆధారాలను మాత్రమే సేకరిస్తుంది.",
    bullet2: "డిపిడిపి చట్టం (DPDP Act) కింద సమ్మతిని ఉపసంహరించుకునే మరియు రికార్డులను తొలగించే హక్కులు సురక్షితం."
  }
};

/**
 * Summarizes complex legal privacy policy text into 2 crisp, plain-English/Hindi/Telugu bullet points.
 * Automatically fails over to the intelligent rule-based analyzer if API key is missing or request times out.
 * 
 * @param {string} policyText - Raw legal terms or privacy policy content
 * @param {string} [siteName='Website'] - Name of the website/service
 * @param {object} [options={}] - Custom options (timeout, apiKey, language, etc.)
 * @returns {Promise<{
 *   success: boolean,
 *   summary: string,
 *   bullets: string[],
 *   riskLevel: 'Low' | 'Medium' | 'High',
 *   keyTakeaways: string[],
 *   isFallback: boolean,
 *   modelUsed: string
 * }>}
 */
async function summarizePrivacyPolicy(policyText, siteName = 'Website', options = {}) {
  const cleanText = (policyText || '').trim();
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
  const language = (options.language || 'EN').toUpperCase(); // EN, HI, TE

  if (!cleanText) {
    return {
      success: true,
      summary: language === 'HI'
        ? `• ${siteName} सेवा वितरण के लिए मानक खाता विवरण एकत्र करता है।\n• उपयोगकर्ता डीपीडीपी अधिनियम 2023 के तहत सहमति वापस ले सकते हैं।`
        : language === 'TE'
        ? `• ${siteName} సేవా పంపిణీ కోసం ప్రామాణిక ఖాతా వివరాలను సేకరిస్తుంది.\n• వినియోగదారులు డిపిడిపి చట్టం 2023 కింద సమ్మతిని ఉపసంహరించుకోవచ్చు.`
        : `• ${siteName} collects standard account details for service delivery.\n• Users may exercise consent revocation under DPDP Act 2023.`,
      bullets: language === 'HI'
        ? [`${siteName} सेवा वितरण के लिए मानक खाता विवरण एकत्र करता है।`, `उपयोगकर्ता डीपीडीपी अधिनियम 2023 के तहत सहमति वापस ले सकते हैं।`]
        : language === 'TE'
        ? [`${siteName} సేవా పంపిణీ కోసం ప్రామాణిక ఖాతా వివరాలను సేకరిస్తుంది.`, `వినియోగదారులు డిపిడిపి చట్టం 2023 కింద సమ్మతిని ఉపసంహరించుకోవచ్చు.`]
        : [`${siteName} collects standard account details for service delivery.`, `Users may exercise consent revocation under DPDP Act 2023.`],
      riskLevel: 'Low',
      keyTakeaways: ['Standard Account Data', 'DPDP Protected'],
      isFallback: true,
      modelUsed: 'rule-based-default'
    };
  }

  // Attempt Gemini API call if API key is available
  if (apiKey) {
    try {
      const geminiResult = await callGeminiAPI(cleanText, siteName, apiKey, options.timeout || DEFAULT_TIMEOUT_MS, language);
      if (geminiResult && geminiResult.bullets && geminiResult.bullets.length >= 2) {
        return {
          success: true,
          summary: geminiResult.bullets.map(b => `• ${b}`).join('\n'),
          bullets: geminiResult.bullets,
          riskLevel: geminiResult.riskLevel || 'Medium',
          keyTakeaways: geminiResult.keyTakeaways || ['DPDP §6 Consent', 'Data Retention'],
          isFallback: false,
          modelUsed: GEMINI_MODEL
        };
      }
    } catch (err) {
      console.warn(`[aiService] Gemini API call failed (${err.message}). Activating rule-based fallback.`);
    }
  }

  // Robust Rule-Based Fallback Engine
  return generateRuleBasedSummary(cleanText, siteName, language);
}

/**
 * Calls the Google Gemini API with strict temperature and timeout.
 */
async function callGeminiAPI(policyText, siteName, apiKey, timeoutMs, language = 'EN') {
  let langInstruction = "English.";
  if (language === 'HI') langInstruction = "Hindi (हिंदी). Provide the responses in Hindi language script.";
  if (language === 'TE') langInstruction = "Telugu (తెలుగు). Provide the responses in Telugu language script.";

  const prompt = `You are PrivacyLens AI, an expert privacy analyst under India's Digital Personal Data Protection (DPDP) Act 2023.
Analyze the following privacy policy excerpt for the website "${siteName}".

Provide EXACTLY TWO plain-language sentences in ${langInstruction} (max 2 sentences total, no complex legal jargon):
1. Bullet 1: What personal data is collected and whether it is shared with third parties or advertisers.
2. Bullet 2: How long data is retained and how the user can exercise DPDP rights (revocation or erasure).

Also assign a risk level: "Low", "Medium", or "High".
Return your response in STRICT JSON format:
{
  "bullets": [
    "Sentence 1 in requested language describing data collected and third-party sharing.",
    "Sentence 2 in requested language describing retention and DPDP consent revocation/erasure rights."
  ],
  "riskLevel": "Low" | "Medium" | "High",
  "keyTakeaways": ["Short Tag 1", "Short Tag 2"]
}

Privacy Policy Text:
"""
${policyText.slice(0, 4000)}
"""`;

  const payload = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 384,
      responseMimeType: "application/json"
    }
  });

  return new Promise((resolve, reject) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: timeoutMs
    }, (res) => {
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(rawData);
            const candidateText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              const jsonResult = JSON.parse(candidateText);
              resolve(jsonResult);
              return;
            }
            reject(new Error('Invalid Gemini response format'));
          } catch (e) {
            reject(new Error(`JSON Parse Error on Gemini output: ${e.message}`));
          }
        } else {
          reject(new Error(`Gemini API returned status ${res.statusCode}: ${rawData.slice(0, 100)}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Gemini API request timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

/**
 * Intelligent Rule-Based Fallback Policy Analyzer with multilingual fallbacks (§5(3) + §6(3) support).
 */
function generateRuleBasedSummary(text, siteName, language = 'EN') {
  const lower = text.toLowerCase();

  // Pattern detection
  const hasThirdPartyAds = /third[- ]party|ad network|advertising partner|share.*advertis|marketing partner|affiliate/i.test(lower);
  const hasTracking = /track|cookie|pixel|behavioral|analytics|device fingerprint|ip address/i.test(lower);
  const hasSensitiveData = /biometric|location|financial|card|bank|health|aadhaar|pan/i.test(lower);
  const hasIndefiniteRetention = /indefinitely|as long as needed|perpetual|retained until account/i.test(lower);
  const hasExplicitOptOut = /opt[- ]out|unsubscribe|revoke consent|dpdp|erasure|delete data/i.test(lower);
  const hasPhoneEmail = /email|phone|mobile|contact number/i.test(lower);

  // Determine Risk Level
  let riskScore = 0;
  if (hasThirdPartyAds) riskScore += 2;
  if (hasTracking) riskScore += 1;
  if (hasSensitiveData) riskScore += 3;
  if (hasIndefiniteRetention) riskScore += 1;
  if (!hasExplicitOptOut) riskScore += 1;

  let riskLevel = 'Low';
  if (riskScore >= 4) riskLevel = 'High';
  else if (riskScore >= 2) riskLevel = 'Medium';

  // Output generation based on selected language
  let bullet1 = '';
  let bullet2 = '';

  if (language === 'HI') {
    const dictionary = HINDI_FALLBACKS[riskLevel.toLowerCase() + 'Risk'] || HINDI_FALLBACKS.medRisk;
    bullet1 = dictionary.bullet1.replace('यह वेबसाइट', `${siteName}`);
    bullet2 = dictionary.bullet2;
  } else if (language === 'TE') {
    const dictionary = TELUGU_FALLBACKS[riskLevel.toLowerCase() + 'Risk'] || TELUGU_FALLBACKS.medRisk;
    bullet1 = dictionary.bullet1.replace('ఈ వెబ్‌సైట్', `${siteName}`);
    bullet2 = dictionary.bullet2;
  } else {
    // English default
    if (hasThirdPartyAds && hasPhoneEmail) {
      bullet1 = `${siteName} collects your contact details and shares behavioral data with 3rd-party advertising networks.`;
    } else if (hasThirdPartyAds) {
      bullet1 = `${siteName} shares analytical and browsing data with marketing partners for targeted promotions.`;
    } else if (hasTracking) {
      bullet1 = `${siteName} tracks device analytics and user activity to optimize internal platform performance.`;
    } else {
      bullet1 = `${siteName} collects basic account credentials and profile metadata strictly for account management.`;
    }

    if (hasExplicitOptOut) {
      bullet2 = `Data is retained during active usage; users can exercise Section 6 Consent Revocation and Section 12 Erasure anytime.`;
    } else if (hasIndefiniteRetention) {
      bullet2 = `Data is retained until explicit deletion; request DPDP Section 12 erasure to purge inactive records.`;
    } else {
      bullet2 = `You retain the statutory right under India's DPDP Act to revoke marketing permissions and demand data deletion.`;
    }
  }

  const takeaways = [];
  if (hasThirdPartyAds) takeaways.push(language === 'HI' ? 'विज्ञापनदाता साझाकरण' : language === 'TE' ? 'ప్రకటనకర్తల భాగస్వామ్యం' : '3rd-Party Ads');
  if (hasTracking) takeaways.push(language === 'HI' ? 'गतिविधि ट्रैकिंग' : language === 'TE' ? 'యాక్టివిటీ ట్రాకింగ్' : 'Activity Tracking');
  if (hasSensitiveData) takeaways.push(language === 'HI' ? 'संवेदनशील डेटा' : language === 'TE' ? 'సున్నితమైన డేటా' : 'Sensitive Data');
  takeaways.push('DPDP §6/§12');

  return {
    success: true,
    summary: `• ${bullet1}\n• ${bullet2}`,
    bullets: [bullet1, bullet2],
    riskLevel,
    keyTakeaways: takeaways.slice(0, 3),
    isFallback: true,
    modelUsed: 'rule-based-nlp-engine'
  };
}

/**
 * Generates an official DPDP Act Section 6 (Consent Revocation) or Section 12 (Data Erasure) Legal Notice.
 * Used by Tier 3 Legal Notice Generator.
 */
function generateLegalNotice({
  userName = 'Data Principal',
  userEmail = 'user@example.com',
  websiteName = 'Website',
  dpoEmail = 'dpo@example.com',
  requestType = 'CONSENT_REVOCATION',
  targetConsent = 'Marketing Emails',
  customNotes = ''
}) {
  const currentDate = new Date().toISOString().split('T')[0];
  const isErasure = requestType === 'DATA_ERASURE' || requestType === 'ACCOUNT_DELETION';

  const subject = isErasure
    ? `FORMAL NOTICE: Exercise of Right to Data Erasure (Section 12, DPDP Act 2023) — ${userEmail}`
    : `FORMAL NOTICE: Revocation of Consent (Section 6, DPDP Act 2023) — ${userEmail}`;

  const body = `Date: ${currentDate}
To: Data Protection Officer / Privacy Team (${websiteName})
Email: ${dpoEmail}

From: ${userName}
Registered Email: ${userEmail}

Subject: ${subject}

Dear Data Protection Officer,

I am writing to you in my capacity as a Data Principal under the Digital Personal Data Protection Act, 2023 (DPDP Act).

${
  isErasure
    ? `Pursuant to Section 12(1) of the DPDP Act 2023, I hereby formally request the complete ERASURE and PERMANENT DELETION of all personal data, behavioral profiles, identifiers, and associated records held by ${websiteName} associated with my email address (${userEmail}).`
    : `Pursuant to Section 6(4) of the DPDP Act 2023, I hereby formally REVOKE my consent previously granted for: "${targetConsent}". Please ensure my personal data is no longer processed for marketing or secondary purposes.`
}

${customNotes ? `Specific Instruction: ${customNotes}\n` : ''}
Under Section 6(6) and Section 12(3) of the DPDP Act, you are obligated to cease processing such personal data and ensure that your data processors similarly erase or cease processing my data without unreasonable delay.

Please acknowledge receipt of this notice and confirm completion of this statutory request in writing within the stipulated timeframe.

Sincerely,
${userName}
Data Principal
Email: ${userEmail}
Timestamp: ${new Date().toISOString()}`;

  return {
    subject,
    body,
    mailtoUrl: `mailto:${encodeURIComponent(dpoEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  };
}

module.exports = {
  summarizePrivacyPolicy,
  generateRuleBasedSummary,
  generateLegalNotice,
  callGeminiAPI
};
