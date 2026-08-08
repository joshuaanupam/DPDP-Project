import React, { useState, useMemo } from 'react';
import { ShieldAlert, AlertTriangle, Info, Scale, CheckCircle2, AlertCircle } from 'lucide-react';

export const PenaltyShield = () => {
  const [violations, setViolations] = useState({
    securitySafeguard: false, // Up to 250 Cr
    notificationFailure: false, // Up to 200 Cr
    childObligations: false, // Up to 150 Cr
    significantFiduciary: false, // Up to 150 Cr
  });

  const [orgScale, setOrgScale] = useState('ENTERPRISE'); // SMALL, MEDIUM, ENTERPRISE
  const [dataVolume, setDataVolume] = useState('LARGE'); // SMALL (<10k), MEDIUM (10k-1M), LARGE (1M+)

  const toggleViolation = (key) => {
    setViolations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const calculatedFines = useMemo(() => {
    let totalMaxFine = 0;
    const items = [];

    if (violations.securitySafeguard) {
      totalMaxFine += 250;
      items.push({ label: 'Security Safeguard Breach (§8(5))', max: 250, desc: 'Failure to implement reasonable security safeguards to prevent personal data breach.' });
    }
    if (violations.notificationFailure) {
      totalMaxFine += 200;
      items.push({ label: 'Breach Notification Failure (§8(6))', max: 200, desc: 'Failure to notify the Board and affected data principals in the event of a data breach.' });
    }
    if (violations.childObligations) {
      totalMaxFine += 150;
      items.push({ label: 'Child Obligations Breach (§9)', max: 150, desc: 'Processing data harmful to children, or tracking/targeted ads targeting children.' });
    }
    if (violations.significantFiduciary) {
      totalMaxFine += 150;
      items.push({ label: 'Significant Fiduciary Breach (§10)', max: 150, desc: 'Failure to appoint a DPO, conduct Data Protection Impact Assessments (DPIA), or execute audits.' });
    }

    // Apply scale multiplier for estimated exposure
    let multiplier = 1.0;
    if (orgScale === 'SMALL') multiplier *= 0.15;
    if (orgScale === 'MEDIUM') multiplier *= 0.5;
    
    if (dataVolume === 'SMALL') multiplier *= 0.5;
    if (dataVolume === 'MEDIUM') multiplier *= 0.8;

    const estimatedExposure = Math.min(totalMaxFine, totalMaxFine * multiplier);

    return {
      maxExposure: totalMaxFine,
      estimatedExposure: Math.round(estimatedExposure * 100) / 100,
      violatedItems: items,
      riskLevel: estimatedExposure > 200 ? 'CRITICAL' : estimatedExposure > 50 ? 'HIGH' : estimatedExposure > 0 ? 'MODERATE' : 'SAFE'
    };
  }, [violations, orgScale, dataVolume]);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'CRITICAL': return { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30', stroke: '#EF4444' };
      case 'HIGH': return { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', stroke: '#F59E0B' };
      case 'MODERATE': return { text: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', stroke: '#EAB308' };
      default: return { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', stroke: '#10B981' };
    }
  };

  const colors = getRiskColor(calculatedFines.riskLevel);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      
      {/* Violation Selectors */}
      <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">DPDP Act Fine Calculator</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Identify non-compliance exposure under Schedule 1 of the DPDP Act 2023</p>
          </div>
        </div>

        {/* Categories checklist */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Select Violation Types</h3>
          
          {/* Item 1 */}
          <div 
            onClick={() => toggleViolation('securitySafeguard')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
              violations.securitySafeguard 
                ? 'bg-rose-500/5 border-rose-500/40 shadow-sm' 
                : 'glass-card border-slate-200/50 hover:border-slate-300'
            }`}
          >
            <input 
              type="checkbox" 
              checked={violations.securitySafeguard} 
              onChange={() => {}} 
              className="mt-1 rounded text-rose-500 focus:ring-rose-500 h-4 w-4 bg-transparent border-slate-300"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Breach of Security Safeguards (§8(5))</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Up to ₹250 Cr</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Failure to implement reasonable security safeguards to prevent personal data breaches.</p>
            </div>
          </div>

          {/* Item 2 */}
          <div 
            onClick={() => toggleViolation('notificationFailure')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
              violations.notificationFailure 
                ? 'bg-rose-500/5 border-rose-500/40 shadow-sm' 
                : 'glass-card border-slate-200/50 hover:border-slate-300'
            }`}
          >
            <input 
              type="checkbox" 
              checked={violations.notificationFailure} 
              onChange={() => {}} 
              className="mt-1 rounded text-rose-500 focus:ring-rose-500 h-4 w-4 bg-transparent border-slate-300"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Breach Notification Failure (§8(6))</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Up to ₹200 Cr</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Failure to notify the Board and affected data principals in the event of a personal data breach.</p>
            </div>
          </div>

          {/* Item 3 */}
          <div 
            onClick={() => toggleViolation('childObligations')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
              violations.childObligations 
                ? 'bg-rose-500/5 border-rose-500/40 shadow-sm' 
                : 'glass-card border-slate-200/50 hover:border-slate-300'
            }`}
          >
            <input 
              type="checkbox" 
              checked={violations.childObligations} 
              onChange={() => {}} 
              className="mt-1 rounded text-rose-500 focus:ring-rose-500 h-4 w-4 bg-transparent border-slate-300"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Breach of Obligations in Relation to Children (§9)</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Up to ₹150 Cr</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Processing data harmful to children, or tracking/targeted ads targeting children.</p>
            </div>
          </div>

          {/* Item 4 */}
          <div 
            onClick={() => toggleViolation('significantFiduciary')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-4 ${
              violations.significantFiduciary 
                ? 'bg-rose-500/5 border-rose-500/40 shadow-sm' 
                : 'glass-card border-slate-200/50 hover:border-slate-300'
            }`}
          >
            <input 
              type="checkbox" 
              checked={violations.significantFiduciary} 
              onChange={() => {}} 
              className="mt-1 rounded text-rose-500 focus:ring-rose-500 h-4 w-4 bg-transparent border-slate-300"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Significant Data Fiduciary Breaches (§10)</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Up to ₹150 Cr</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Failure to appoint a DPO, execute regular audits, or perform Data Protection Impact Assessments (DPIA).</p>
            </div>
          </div>

        </div>

        {/* Environmental Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-200/50">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">Organization Scale</label>
            <div className="grid grid-cols-3 gap-2">
              {['SMALL', 'MEDIUM', 'ENTERPRISE'].map(scale => (
                <button
                  key={scale}
                  onClick={() => setOrgScale(scale)}
                  className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${
                    orgScale === scale 
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                      : 'glass-card border-slate-200/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {scale}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">Data Principals Volume</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'SMALL', label: '<10k' },
                { key: 'MEDIUM', label: '10k - 1M' },
                { key: 'LARGE', label: '1M+' }
              ].map(vol => (
                <button
                  key={vol.key}
                  onClick={() => setDataVolume(vol.key)}
                  className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${
                    dataVolume === vol.key 
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                      : 'glass-card border-slate-200/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {vol.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Exposure Summary Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/50 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center">
            <Info className="w-4 h-4 mr-1.5 text-indigo-400" /> Exposure Summary
          </h3>

          <div className="text-center py-6 border-b border-slate-200/50">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Max Statutory Cap</span>
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-heading">
              ₹{calculatedFines.maxExposure} <span className="text-lg text-slate-500">Cr</span>
            </div>
          </div>

          <div className="py-6 border-b border-slate-200/50 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Estimated Exposure</span>
            <div className="text-5xl font-black font-heading text-rose-500 animate-pulse">
              ₹{calculatedFines.estimatedExposure} <span className="text-xl">Cr</span>
            </div>
            <span className={`inline-flex items-center space-x-1 mt-3 text-[10px] font-extrabold px-3 py-1 rounded-full border ${colors.bg} ${colors.border} ${colors.text}`}>
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              {calculatedFines.riskLevel} RISK PROFILE
            </span>
          </div>

          <div className="py-4 space-y-3">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mitigation Action Plan</h4>
            <div className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>DPIA Remediation timeline: <strong>{calculatedFines.estimatedExposure > 100 ? '90 Days' : '30 Days'}</strong></span>
            </div>
            <div className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Appoint DPO / Privacy Auditor immediately</span>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${colors.bg} ${colors.border} text-xs ${colors.text} leading-relaxed`}>
          <div className="flex items-center space-x-1.5 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="font-bold">Compliance Note:</span>
          </div>
          Under Section 33 of the DPDP Act 2023, penalties are decided based on the severity of the breach, mitigation efforts, and compliance history.
        </div>

      </div>

    </div>
  );
};
