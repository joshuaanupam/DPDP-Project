import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Send, Plus, X, Trash2, Mail, CheckCircle2, UserPlus } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const NominationForm = () => {
  const { userData, nominees = [], addNominee, removeNominee } = usePrivacy();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    relation: 'Spouse',
    scope: 'Full Rights',
    authorized: false
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddNomination = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!form.name || !form.email || !form.phone) {
      setError('Please fill in all nominee credentials.');
      return;
    }
    if (!form.authorized) {
      setError('You must authorize the nominee by checking the consent checkbox.');
      return;
    }

    const res = await addNominee(form.name, form.email, form.relation);
    if (res && res.success) {
      setSuccessMsg(`Nomination invitation successfully dispatched to ${form.name}.`);
      setForm({
        name: '',
        email: '',
        phone: '',
        relation: 'Spouse',
        scope: 'Full Rights',
        authorized: false
      });
    } else {
      setError('Failed to register nominee.');
    }
  };

  const handleDeleteNomination = async (id) => {
    const res = await removeNominee(id);
    if (res && res.success) {
      setSuccessMsg('Nominee successfully removed.');
    } else {
      setError('Failed to remove nominee.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      
      {/* Form Input Card */}
      <div className="lg:col-span-1 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/50 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Nominate Guardian</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">DPDP Act §14 Guardian Nomination</p>
            </div>
          </div>

          <form onSubmit={handleAddNomination} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Nominee Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                placeholder="Aarav Sharma"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Nominee Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                placeholder="aarav.sharma@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Nominee Phone Number</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Relationship</label>
                <select
                  name="relation"
                  value={form.relation}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium"
                >
                  <option value="Spouse" className="bg-[#131B2E]">Spouse</option>
                  <option value="Child" className="bg-[#131B2E]">Child</option>
                  <option value="Parent" className="bg-[#131B2E]">Parent</option>
                  <option value="Legal Guardian" className="bg-[#131B2E]">Legal Guardian</option>
                  <option value="Trusted Representative" className="bg-[#131B2E]">Representative</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 block">Authority Scope</label>
                <select
                  name="scope"
                  value={form.scope}
                  onChange={handleInputChange}
                  className="w-full py-2 px-3 rounded-xl glass-input text-xs font-medium"
                >
                  <option value="Full Rights" className="bg-[#131B2E]">Full Rights</option>
                  <option value="View-Only" className="bg-[#131B2E]">View-Only</option>
                  <option value="Revocation/Erasure Only" className="bg-[#131B2E]">Revoke/Erase</option>
                </select>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-slate-800">
              <input
                type="checkbox"
                name="authorized"
                id="authorized"
                checked={form.authorized}
                onChange={handleInputChange}
                className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-transparent border-slate-300"
              />
              <label htmlFor="authorized" className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer">
                I hereby authorize this nominee to exercise my statutory rights under Section 14 of the DPDP Act 2023 in the event of my death or incapacity.
              </label>
            </div>
          </form>
        </div>

        <div className="mt-6 space-y-3">
          {error && <p className="text-xs text-rose-400 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{error}</p>}
          {successMsg && <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">{successMsg}</p>}
          
          <button
            onClick={handleAddNomination}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Register Nominee Invitation</span>
          </button>
        </div>

      </div>

      {/* Active Log Table */}
      <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/50">
        <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center">
          <UserCheck className="w-4 h-4 mr-1.5 text-indigo-400" /> Active Guardian Nomination Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/50 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Nominee Details</th>
                <th className="py-3 px-4">Relationship & Scope</th>
                <th className="py-3 px-4">Nomination Ref</th>
                <th className="py-3 px-4">Consent Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20 dark:divide-slate-800/60">
              {nominees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                    No guardian nominations active.
                  </td>
                </tr>
              ) : (
                nominees.map((nom) => {
                  const status = nom.confirmed ? 'CONFIRMED' : 'PENDING';
                  const ref = `PL-NOM-${nom.id.substring(0, 5).toUpperCase()}`;
                  return (
                    <tr key={nom.id} className="hover:glass-panel/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{nom.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{nom.email}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold block">{nom.relationship}</span>
                        <span className="text-[11px] text-indigo-400">Full Rights</span>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-400 font-bold">
                        <div>{ref}</div>
                        <div className="text-[10px] text-slate-500 font-sans font-normal">{new Date(nom.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center space-x-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border ${
                          status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          {status === 'CONFIRMED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {status === 'PENDING' && <ShieldAlert className="w-3 h-3 mr-1" />}
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDeleteNomination(nom.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all hover:scale-105"
                          title="Delete Nomination"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
