import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from '../services/authService';
import { validateReferralCode } from '../services/referralService';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, pendingReferralCode, setPendingReferralCode } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [referralInput, setReferralInput] = useState<string>(pendingReferralCode || '');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validatingRef, setValidatingRef] = useState<boolean>(false);
  const [refValidStatus, setRefValidStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  if (!authModalOpen) return null;

  const handleRefBlur = async () => {
    const code = referralInput.trim().toUpperCase();
    if (!code) {
      setRefValidStatus('idle');
      return;
    }
    setValidatingRef(true);
    try {
      const res = await validateReferralCode(code);
      if (res.valid) {
        setRefValidStatus('valid');
        setPendingReferralCode(code);
      } else {
        setRefValidStatus('invalid');
      }
    } catch {
      setRefValidStatus('invalid');
    } finally {
      setValidatingRef(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const cleanRef = referralInput.trim().toUpperCase();
      if (cleanRef) {
        setPendingReferralCode(cleanRef);
        try {
          sessionStorage.setItem('oneag_pending_ref', cleanRef);
        } catch {
          // ignore
        }
      } else {
        setPendingReferralCode('');
        try {
          sessionStorage.removeItem('oneag_pending_ref');
        } catch {
          // ignore
        }
      }
      await signInWithGoogle();
      setAuthModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setSubmitting(false);
          return;
        }

        // Preserve and sync entered referral code (or clear if left empty)
        const cleanRef = referralInput.trim().toUpperCase();
        if (cleanRef) {
          setPendingReferralCode(cleanRef);
          try {
            sessionStorage.setItem('oneag_pending_ref', cleanRef);
          } catch {
            // ignore
          }
        } else {
          setPendingReferralCode('');
          try {
            sessionStorage.removeItem('oneag_pending_ref');
          } catch {
            // ignore
          }
        }

        await signUpWithEmail(email, password, displayName);
        setAuthModalOpen(false);
      } else {
        await signInWithEmail(email, password);
        setAuthModalOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setError('Invalid email or password.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email above to reset password.');
      return;
    }
    setError(null);
    try {
      await resetPassword(email);
      setInfoMessage('Password reset link sent to your email.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email.';
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xl mb-3 shadow-lg shadow-emerald-500/20">
            AG
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isRegister ? 'Create your AG Creator account' : 'Welcome Back to AG Creator'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isRegister
              ? 'Join the transparent multi-platform rewards ecosystem. No joining fee, ever.'
              : 'Sign in to access your referrals and rewards'}
          </p>
        </div>

        {/* Compliance Reminder */}
        <div className="flex items-center gap-2 p-2.5 mb-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
          <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
          <span>100% Free • No Investment Required • Safe Rewards Ledger</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Google Sign-in Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={submitting}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-slate-800" />
          <span className="px-3 text-xs uppercase tracking-wider text-slate-500 font-medium">Or email</span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmitEmail} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Optional Referral Code Input during registration */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Referral Code (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter inviter code"
                  value={referralInput}
                  onChange={(e) => {
                    setReferralInput(e.target.value.toUpperCase());
                    setRefValidStatus('idle');
                  }}
                  onBlur={handleRefBlur}
                  className="w-full px-4 py-2.5 uppercase font-mono bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                {validatingRef && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    Checking...
                  </span>
                )}
                {!validatingRef && refValidStatus === 'valid' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Valid
                  </span>
                )}
                {!validatingRef && refValidStatus === 'invalid' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle size={14} /> Invalid
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter an invitation code if a colleague or friend referred you to AG Creator.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{submitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="text-center mt-5 pt-4 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                setInfoMessage(null);
              }}
              className="text-emerald-400 font-semibold hover:underline ml-1 cursor-pointer"
            >
              {isRegister ? 'Sign in' : 'Create free account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
