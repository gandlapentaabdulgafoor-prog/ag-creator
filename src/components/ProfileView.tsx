import React from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  Smartphone,
  Globe,
  Apple,
  Award,
  Calendar,
  LogOut,
  Key,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfileView: React.FC = () => {
  const { currentUser, userProfile, setAuthModalOpen, logout } = useAuth();

  if (!currentUser) {
    return (
      <div className="max-w-lg mx-auto p-8 my-12 text-center bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In to View Profile</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Manage your account, referral identity, and view your multi-platform Firebase sync status.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* User Header Profile Card */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'Profile'}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-xl shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 text-emerald-400 flex items-center justify-center font-black text-3xl border border-emerald-500/30 shrink-0">
              {(userProfile?.displayName || currentUser.email || 'U')[0].toUpperCase()}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-bold text-white">
                {userProfile?.displayName || currentUser.displayName || 'AG Creator Member'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                {userProfile?.tier || 'Bronze'} Tier
              </span>
            </div>

            <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail size={14} className="text-slate-500" />
              <span>{currentUser.email}</span>
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Referral Code:</span>
                <span className="font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {userProfile?.referralCode}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Joined:</span>
                <span className="text-slate-300">
                  {userProfile?.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString()
                    : 'Today'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 self-center sm:self-start"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* Cross-Platform Sync Status */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Globe size={18} className="text-emerald-400" />
          <span>Unified Multi-Platform Device Sync</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your AG Creator profile, referral code, and points ledger are hosted on a shared Firebase Firestore backend. Sign in with this account on any device to resume seamlessly:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Globe size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Responsive Web</p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={11} /> Connected Now
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Smartphone size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Android Native</p>
              <p className="text-[11px] text-slate-400">Kotlin + Compose App</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Apple size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">iOS App</p>
              <p className="text-[11px] text-slate-400">SwiftUI Client</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Regulatory Compliance Overview */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-400" />
          <span>Security & Regulatory Integrity</span>
        </h3>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3 text-xs">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <strong className="text-white">Firestore ABAC Rules Deployed:</strong>
              <p className="text-slate-400 mt-0.5">
                Client-side tampering is blocked. Users cannot write arbitrary points or modify another member's referrals.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3 text-xs">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <strong className="text-white">Zero Capital / No Joining Fee:</strong>
              <p className="text-slate-400 mt-0.5">
                Participation is 100% complimentary. There are no investment obligations or recurring charges.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3 text-xs">
            <Lock size={16} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="text-white">Withdrawals Disabled Initially (Beta):</strong>
              <p className="text-slate-400 mt-0.5">
                In strict compliance with anti-pyramid and anti-fraud regulations, withdrawals remain locked during early access phase.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
