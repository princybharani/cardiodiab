import React, { useState } from 'react';
import { Heart, Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles, Activity, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { signIn, signUp } from '../supabaseClient';

export default function AuthPage({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(true); // default to Sign Up page first as requested
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const user = await signUp(email, password, fullName);
        setSuccessMsg(`Welcome, ${user.fullName || user.email}! Account created successfully.`);
        setTimeout(() => {
          onAuthSuccess(user);
        }, 700);
      } else {
        const user = await signIn(email, password);
        setSuccessMsg(`Welcome back, ${user.fullName || user.email}!`);
        setTimeout(() => {
          onAuthSuccess(user);
        }, 500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const demoEmail = 'patient.demo@cardiodiab.org';
      const user = await signIn(demoEmail, 'demo123456');
      setSuccessMsg('Signed in as Demo Patient!');
      setTimeout(() => {
        onAuthSuccess(user);
      }, 500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon & Title */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-teal-400 text-white shadow-xl shadow-rose-900/40 mb-4">
          <Heart className="w-8 h-8 fill-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          CardioDiab
        </h2>
        <p className="mt-1 text-sm text-teal-200">
          AI Cardiovascular & Diabetes Clinical Triage Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-100">
          {/* Header Mode Tabs */}
          <div className="flex items-center justify-center mb-6">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl w-full">
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  isSignUp ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account (Sign Up)
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
                className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                  !isSignUp ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Minimum 6 characters</p>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 via-teal-700 to-rose-600 hover:from-teal-700 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-800/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Patient Account & Continue' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Instant Access */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col space-y-3">
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Instant 1-Click Guest Access</span>
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold transition"
              >
                {isSignUp ? 'Already have an account? Sign In here' : "Don't have an account? Sign Up here"}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Badges below card */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-teal-200/80 text-[11px]">
          <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <FileText className="w-4 h-4 text-teal-300 mb-1" />
            <span>PDF/Image OCR</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Activity className="w-4 h-4 text-rose-300 mb-1" />
            <span>Smart MCQs</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-300 mb-1" />
            <span>Traffic Light Triage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
