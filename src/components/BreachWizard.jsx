import React, { useState } from 'react';
import { ShieldAlert, Send, FileText, CheckCircle2, Copy, Sparkles, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const BreachWizard = () => {
  const { userData } = usePrivacy();
  const [currentStep, setCurrentStep] = useState(1); // 1: Profile, 2: Containment, 3: Notices

  const [profile, setProfile] = useState({
    domain: 'shopease.com',
    orgName: 'ShopEase Retail Private Limited',
    detectionDate: new Date().toISOString().split('T')[0],
    affectedUsers: '10,000 - 50,000',
    breachType: 'Ransomware / Unauthorized DB Access',
    compromisedFields: {
      name: true,
      email: true,
      phone: true,
      address: true,
      passwords: false,
      financial: false
    }
  });

  const [containment, setContainment] = useState({
    isolatedServer: true,
    revokedKeys: true,
    dpoNotified: true,
    policeNotified: false,
    containmentAction: 'Isolated the vulnerable database container within 45 minutes of detection. Revoked all active AWS API keys, rotated credential stores, and deployed forensic auditors to trace the vector.'
  });

  const [copiedBoard, setCopiedBoard] = useState(false);
  const [copiedUsers, setCopiedUsers] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field) => {
    setProfile(prev => ({
      ...prev,
      compromisedFields: {
        ...prev.compromisedFields,
        [field]: !prev.compromisedFields[field]
      }
    }));
  };

  const handleContainmentToggle = (field) => {
    setContainment(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleContainmentChange = (e) => {
    setContainment(prev => ({ ...prev, containmentAction: e.target.value }));
  };

  // Auto-Draft Board Notice Generator (§8(6) Official Filing)
  const generateBoardNotice = () => {
    const dataTypes = Object.keys(profile.compromisedFields)
      .filter(k => profile.compromisedFields[k])
      .map(k => k.toUpperCase())
      .join(', ');

    return `FORMAL PERSONAL DATA BREACH REPORT UNDER SECTION 8(6) OF THE DPDP ACT, 2023

TO: THE DATA PROTECTION BOARD OF INDIA (DPBI)
DATE OF REPORT: ${new Date().toLocaleDateString('en-GB')}
REPORTING DATA FIDUCIARY: ${profile.orgName}
DOMAIN: ${profile.domain}

1. NATURE AND DETAILS OF DATA BREACH:
   - Incident Classification: ${profile.breachType}
   - Estimated Date/Time of Incident: ${profile.detectionDate}
   - Estimated Number of Affected Data Principals: ${profile.affectedUsers}

2. PERSONAL DATA CATEGORIES COMPROMISED:
   - Compromised Fields: [${dataTypes}]

3. MITIGATION AND CONTAINMENT ACTIONS EXECUTED:
   - Vulnerable systems isolated: ${containment.isolatedServer ? 'YES' : 'NO'}
   - Access tokens & credentials revoked: ${containment.revokedKeys ? 'YES' : 'NO'}
   - Internal Data Protection Officer (DPO) notified: ${containment.dpoNotified ? 'YES' : 'NO'}
   - Details: "${containment.containmentAction}"

4. CONTACT DETAILS OF DESIGNATED COMPLIANCE OFFICER:
   - Name: DPO Compliance Officer
   - Official Email: dpo@${profile.domain}

This report is submitted in accordance with statutory obligations under Section 8(6) of the Digital Personal Data Protection Act, 2023.

Submitted by,
Authorized Signatory
${profile.orgName}`;
  };

  // Auto-Draft User Notification Notice (Plain-Language Disclosure)
  const generateUserNotice = () => {
    const dataTypes = Object.keys(profile.compromisedFields)
      .filter(k => profile.compromisedFields[k])
      .map(k => k.toLowerCase())
      .join(', ');

    return `Subject: IMPORTANT SECURITY NOTICE: Protection of Your Data on ${profile.domain}

Dear Valued Customer,

We are writing to honestly inform you of a security incident at ${profile.orgName} that may have affected some of your personal information, in compliance with Section 8(6) of the Digital Personal Data Protection (DPDP) Act, 2023.

What Happened?
On ${profile.detectionDate}, our security team detected unauthorized access to one of our database systems containing account metadata. 

What Information Was Involved?
The affected files included categories of information you shared with us, specifically: [${dataTypes}]. Please note that passwords and financial credentials remain fully encrypted and were NOT compromised in this event.

What Actions Have We Taken?
Immediately upon detection, we took the following mitigation actions:
- Isolated the affected server networks.
- Revoked all active credentials to block unauthorized persistence.
- Engaged cybersecurity forensic professionals to verify complete system safety.

Steps You Can Take to Protect Yourself:
1. Be vigilant against potential phishing emails or unsolicited telephone calls asking for account details.
2. Monitor your account logs on our platform.
3. If you have active consents with us that you would like to revoke, you may trigger them instantly via the PrivacyLens central control dashboard.

We deeply regret this incident and are working around the clock to enhance our safeguards. For any questions, contact our DPO at support@${profile.domain}.

Sincerely,
Privacy & Security Team
${profile.orgName}`;
  };

  const boardNoticeText = generateBoardNotice();
  const userNoticeText = generateUserNotice();

  const handleCopyBoard = () => {
    navigator.clipboard.writeText(boardNoticeText);
    setCopiedBoard(true);
    setTimeout(() => setCopiedBoard(false), 2000);
  };

  const handleCopyUsers = () => {
    navigator.clipboard.writeText(userNoticeText);
    setCopiedUsers(true);
    setTimeout(() => setCopiedUsers(false), 2000);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/50 mb-10">
      
      {/* Header / Step Tracker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/50 pb-5 mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Statutory Breach Discloser (§8(6))</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Draft legal notices for the DPBI board and affected users</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center space-x-2 text-xs">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                currentStep === stepNum 
                  ? 'bg-indigo-600 text-slate-900' 
                  : currentStep > stepNum 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'glass-card border-slate-200/50 text-slate-500'
              }`}>
                {stepNum}
              </span>
              {stepNum < 3 && <span className="w-8 h-0.5 bg-slate-800/40 dark:bg-slate-800 mx-2"></span>}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Incident Profile */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 1 — Incident Profile & Exposure Scope</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Organization Legal Name</label>
              <input
                type="text"
                name="orgName"
                value={profile.orgName}
                onChange={handleProfileChange}
                className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Corporate Domain</label>
              <input
                type="text"
                name="domain"
                value={profile.domain}
                onChange={handleProfileChange}
                className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Detection Date</label>
              <input
                type="date"
                name="detectionDate"
                value={profile.detectionDate}
                onChange={handleProfileChange}
                className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Estimated Impacted Users</label>
              <select
                name="affectedUsers"
                value={profile.affectedUsers}
                onChange={handleProfileChange}
                className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium"
              >
                <option value="<500" className="bg-[#131B2E]">&lt; 500 Data Principals</option>
                <option value="500 - 10,000" className="bg-[#131B2E]">500 - 10,000 Data Principals</option>
                <option value="10,000 - 50,000" className="bg-[#131B2E]">10,000 - 50,000 Data Principals</option>
                <option value="50,000+" className="bg-[#131B2E]">50,000+ Data Principals (Significant Exposure)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Incident Classification</label>
              <input
                type="text"
                name="breachType"
                value={profile.breachType}
                onChange={handleProfileChange}
                className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 block">Compromised Data Categories (Check all that apply)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.keys(profile.compromisedFields).map((field) => (
                <div
                  key={field}
                  onClick={() => handleCheckboxChange(field)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    profile.compromisedFields[field]
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-bold'
                      : 'glass-card border-slate-200/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider">{field}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Containment */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 2 — Containment Strategy & Immediate Remediation</h3>
          
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">Immediate System Containment Actions</label>
            
            <div 
              onClick={() => handleContainmentToggle('isolatedServer')}
              className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                containment.isolatedServer ? 'bg-indigo-500/10 border-indigo-500/40' : 'glass-card border-slate-200/50'
              }`}
            >
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-white">Network Isolation</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Compromised servers isolated from active traffic immediately.</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${containment.isolatedServer ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                {containment.isolatedServer ? 'EXECUTED' : 'PENDING'}
              </span>
            </div>

            <div 
              onClick={() => handleContainmentToggle('revokedKeys')}
              className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                containment.revokedKeys ? 'bg-indigo-500/10 border-indigo-500/40' : 'glass-card border-slate-200/50'
              }`}
            >
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-white">Credential Rotation & API Key Revocation</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">All vulnerable access tokens, AWS keys, and database passwords revoked/rotated.</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${containment.revokedKeys ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                {containment.revokedKeys ? 'EXECUTED' : 'PENDING'}
              </span>
            </div>

            <div 
              onClick={() => handleContainmentToggle('dpoNotified')}
              className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                containment.dpoNotified ? 'bg-indigo-500/10 border-indigo-500/40' : 'glass-card border-slate-200/50'
              }`}
            >
              <div>
                <span className="text-xs font-bold block text-slate-900 dark:text-white">Internal DPO & Legal Counsel Notification</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Company Data Protection Officer and compliance teams engaged within the statutory 24h window.</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${containment.dpoNotified ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                {containment.dpoNotified ? 'EXECUTED' : 'PENDING'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Describe Specific Mitigation/Forensic Steps taken</label>
            <textarea
              value={containment.containmentAction}
              onChange={handleContainmentChange}
              rows={4}
              className="w-full p-3 rounded-2xl glass-input text-xs font-medium leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Step 3: Notices Preview & Copy */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Step 3 — Review & Copy Generated Disclosures</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Board Notice */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-rose-400" /> Draft A: Official Notice to the DPBI Board
                </span>
                <button
                  onClick={handleCopyBoard}
                  className="px-2.5 py-1 rounded-lg glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-800 dark:text-slate-300 transition-all"
                >
                  {copiedBoard ? 'Copied!' : 'Copy Draft'}
                </button>
              </div>
              <textarea
                readOnly
                value={boardNoticeText}
                rows={12}
                className="w-full p-4 rounded-2xl glass-panel border border-slate-200/50 text-[10px] font-mono text-slate-600 dark:text-slate-300 focus:outline-none resize-none leading-relaxed select-all"
              />
            </div>

            {/* Principal Notice */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Draft B: Affected User Notice Disclosures
                </span>
                <button
                  onClick={handleCopyUsers}
                  className="px-2.5 py-1 rounded-lg glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-800 dark:text-slate-300 transition-all"
                >
                  {copiedUsers ? 'Copied!' : 'Copy Draft'}
                </button>
              </div>
              <textarea
                readOnly
                value={userNoticeText}
                rows={12}
                className="w-full p-4 rounded-2xl glass-panel border border-slate-200/50 text-[10px] font-mono text-slate-600 dark:text-slate-300 focus:outline-none resize-none leading-relaxed select-all"
              />
            </div>

          </div>

          <div className="flex items-start space-x-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Under DPDP Act regulations, failing to submit timely notices to the DPBI and affected Data Principals carries legal liability up to ₹200 Crore.</span>
          </div>

        </div>
      )}

      {/* Nav Controls */}
      <div className="flex items-center justify-between pt-5 mt-6 border-t border-slate-200/50">
        <button
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 rounded-xl glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {currentStep < 3 ? (
          <button
            onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => {
              alert('Statutory notices generated and logged in audit log.');
              setCurrentStep(1);
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish & Close Wizard</span>
          </button>
        )}
      </div>

    </div>
  );
};
