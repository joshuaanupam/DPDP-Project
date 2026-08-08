import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Key, Mail, AlertCircle, RefreshCw, User, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { usePrivacy } from '../context/PrivacyContext';

export const LoginPage = () => {
  const { login, register, authLoading } = usePrivacy();
  // mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('joshua@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset inputs when switching modes
  useEffect(() => {
    setError('');
    setSuccess('');
    setShowPassword(false);
    if (mode === 'signin') {
      setEmail('joshua@example.com');
      setPassword('password');
      setName('');
    } else {
      setEmail('');
      setPassword('');
      setName('');
    }
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'forgot') {
      if (!email) {
        setError('Please enter your email address.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        setSuccess(data.message || 'Password reset instructions sent.');
      } catch {
        setError('Could not connect to backend server. Please try again.');
      }
      setLoading(false);
      return;
    }

    if (mode === 'signup' && !name) {
      setError('Please enter your name.');
      return;
    }
    if (!email || !password) {
      setError('Please fill in all credential fields.');
      return;
    }

    setLoading(true);
    let res;
    if (mode === 'signup') {
      res = await register(name, email, password);
    } else {
      res = await login(email, password);
    }
    setLoading(false);

    if (!res.success) {
      setError(res.message || 'Authentication failed. Please verify your details.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans bg-beige-50">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-beige-200/40 blur-[120px]" />
        <div className="absolute -bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-beige-300/30 blur-[120px]" />
        <div className="glass-panel rounded-3xl p-8 max-w-sm w-full mx-4 text-center border border-beige-400/40 flex flex-col items-center">
          <RefreshCw className="w-10 h-10 text-beige-900 animate-spin mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">Verifying Session...</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Checking secure connection with RECLAIM Extension...</p>
        </div>
      </div>
    );
  }

  const titles = {
    signin: { heading: 'Welcome Back', sub: 'Log in to manage your digital footprint and consents' },
    signup: { heading: 'Create Account', sub: 'Sign up to register your digital footprint and rights' },
    forgot: { heading: 'Reset Password', sub: 'Enter your email and we\'ll reset your password' }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans bg-beige-50 dark:bg-zinc-950">
      
      {/* Dynamic colorful blur blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-beige-200/40 blur-[130px] dark:bg-beige-900/5" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[50%] rounded-full bg-beige-300/30 blur-[130px] dark:bg-beige-900/5" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-beige-100/40 blur-[130px] dark:bg-beige-900/5" />
      </div>

      <div className="w-full max-w-md mx-4 relative z-10">
        
        {/* Logo / Title Area */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <img src="/privacylens-logo.svg" alt="PrivacyLens Logo" className="w-16 h-16 rounded-2xl shadow-lg shadow-beige-900/20 border border-beige-400/30 object-cover" />
            <Sparkles className="w-4 h-4 text-beige-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-slate-900 dark:text-white tracking-tight">
            Privacy<span className="gradient-text">Lens</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">DPDP Rights Control Center</p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-beige-400/45 dark:border-zinc-800 shadow-2xl">
          
          {/* Back button for forgot password mode */}
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('signin')}
              className="flex items-center space-x-1.5 text-xs font-semibold text-beige-700 dark:text-beige-300 hover:text-beige-900 dark:hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              {titles[mode].heading}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {titles[mode].sub}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-2 text-rose-500 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start space-x-2 text-emerald-500 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name field — sign up only */}
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-medium focus:ring-1 focus:ring-beige-900 focus:border-beige-900"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email field — all modes */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-medium focus:ring-1 focus:ring-beige-900 focus:border-beige-900"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Password field — sign in and sign up only */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[10px] font-semibold text-beige-700 dark:text-beige-300 hover:text-beige-900 dark:hover:text-white transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-xs font-medium focus:ring-1 focus:ring-beige-900 focus:border-beige-900"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-beige-900 dark:hover:text-beige-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-beige-900 hover:bg-beige-800 text-beige-50 font-bold text-xs shadow-md shadow-beige-900/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-beige-50" />
              ) : (
                <span>
                  {mode === 'signin' ? 'Access Dashboard' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                </span>
              )}
            </button>
          </form>

          {/* Toggle between sign in and sign up */}
          {mode !== 'forgot' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-xs font-semibold text-beige-700 dark:text-beige-300 hover:text-beige-900 dark:hover:text-white transition-colors"
              >
                {mode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-zinc-800 text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              🔒 <strong>Privacy First:</strong> Your credentials are verified against the local SQLite database. We do not store or transmit plain passwords.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
