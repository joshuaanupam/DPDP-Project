import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Key, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const LoginPage = () => {
  const { login, authLoading } = usePrivacy();
  const [email, setEmail] = useState('joshua@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password fields.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans">
        {/* Background blobs */}
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px]" />
        <div className="absolute -bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-cyan-400/20 blur-[120px]" />
        
        <div className="glass-panel rounded-3xl p-8 max-w-sm w-full mx-4 text-center border border-indigo-500/20 flex flex-col items-center">
          <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">Verifying Session...</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Checking secure connection with RECLAIM Extension...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Dynamic colorful blur blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-purple-400/30 blur-[130px] dark:bg-purple-900/10" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[50%] rounded-full bg-cyan-400/30 blur-[130px] dark:bg-cyan-900/10" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-400/30 blur-[130px] dark:bg-indigo-900/10" />
      </div>

      <div className="w-full max-w-md mx-4 relative z-10">
        
        {/* Logo / Title Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/25 border border-indigo-400/30 mb-3">
            <Shield className="w-8 h-8 text-slate-950" />
            <Sparkles className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-slate-900 dark:text-white tracking-tight">
            Privacy<span className="gradient-text">Lens</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">DPDP Rights Control Center</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Welcome Back</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Log in to manage your digital footprint and consents</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2 text-rose-500 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Registered Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  placeholder="joshua@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Master Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              🔒 <strong>Privacy First:</strong> Your credentials are verified against the local SQLite database. We do not store or transmit plain passwords.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
