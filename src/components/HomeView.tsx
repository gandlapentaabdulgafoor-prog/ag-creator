import React, { useState } from 'react';
import {
  Coins,
  Users,
  Award,
  Lock,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Smartphone,
  Apple,
  Globe,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TabType, PlatformView } from '../types';
import { ONEAG_REFERRAL_BASE_URL } from '../config';

interface HomeViewProps {
  onTabChange: (tab: TabType) => void;
  onPlatformChange: (view: PlatformView) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onTabChange, onPlatformChange }) => {
  const { currentUser, userProfile, setAuthModalOpen } = useAuth();
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Every authenticated user receives their unique referral code generated in Firebase.
  // Referral link resolves dynamically to the current app URL.
  const referralCode = userProfile?.referralCode || '';
  const referralLink = referralCode ? `${ONEAG_REFERRAL_BASE_URL}/?ref=${referralCode}` : '';

  const handleCopyCode = () => {
    if (!referralCode) {
      setAuthModalOpen(true);
      return;
    }
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!referralLink) {
      setAuthModalOpen(true);
      return;
    }
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareOnSocial = (platform: 'whatsapp' | 'twitter' | 'telegram') => {
    if (!referralCode) {
      setAuthModalOpen(true);
      return;
    }
    const text = `Join AG Creator with my referral code ${referralCode} to access our verified multi-platform rewards ecosystem. Zero joining fee: ${referralLink}`;
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Top Hero Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles size={14} />
            <span>Unified Multi-Platform Referral & Rewards Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Build your network. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Earn verified rewards.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            AG Creator brings your creative workspace together with verified referrals and rewards across Android, iOS, and Web. No joining fee, with server-validated rewards tracking.
          </p>

          {!currentUser ? (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition shadow-xl shadow-emerald-500/25 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Get Started with AG Creator</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => onPlatformChange('android')}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <Smartphone size={16} className="text-emerald-400" />
                <span>Explore Android Native</span>
              </button>
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onTabChange('refer')}
                className="px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition shadow-xl shadow-emerald-500/25 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Share Your Referral Code</span>
                <Share2 size={16} />
              </button>

              <button
                onClick={() => onTabChange('shop')}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag size={16} className="text-emerald-400" />
                <span>Shop & Earn</span>
              </button>

              <button
                onClick={() => onTabChange('rewards')}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <Coins size={16} className="text-amber-400" />
                <span>View Rewards Ledger</span>
              </button>
            </div>
          )}
        </div>

        {/* Multi-Platform Availability Chips */}
        <div className="relative z-10 mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Target Platforms:</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-slate-300 bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-700">
                <Globe size={13} className="text-emerald-400" /> Web App
              </span>
              <span className="inline-flex items-center gap-1 text-slate-300 bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-700">
                <Smartphone size={13} className="text-emerald-400" /> Android (Kotlin Compose)
              </span>
              <span className="inline-flex items-center gap-1 text-slate-300 bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-700">
                <Apple size={13} className="text-emerald-400" /> iOS (SwiftUI)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <ShieldCheck size={16} />
            <span>Shared Firebase Real-time Sync</span>
          </div>
        </div>
      </section>

      {/* User Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Reward Points
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {userProfile?.pointsBalance ?? 0}
            </span>
            <span className="text-xs font-bold text-amber-400 uppercase">PTS</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {currentUser ? 'Stored on immutable ledger' : 'Points verified via server ledger'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Verified Referrals
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {userProfile?.totalReferrals ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-400">Members</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Server-validated referral attribution</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Loyalty Tier
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {userProfile?.tier ?? 'Bronze'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {userProfile?.tier === 'Platinum'
              ? 'Maximum tier reached'
              : 'Upgrades dynamically with verified referrals'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Withdrawal Status
            </span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
              <Lock size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-300">
              LOCKED (BETA)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Early access policy compliance</p>
        </div>
      </section>

      {/* Quick Referral Sharing Card */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
              <Share2 size={13} />
              <span>Your Unique Referral Identity</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Invite friends to grow your verified rewards ledger
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Every authenticated member receives an exclusive code verified globally in Firebase Firestore. When a friend joins using your link, attribution is validated server-side.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Referral Code Box */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-3 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-500">Your Code</span>
                <span className="font-mono font-extrabold text-lg text-emerald-400 tracking-wider">
                  {referralCode || (currentUser ? 'SYNCING...' : 'SIGN IN REQUIRED')}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                title="Copy referral code"
              >
                {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>
        </div>

        {/* Social Share Pills */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-medium">Quick share to your network:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => shareOnSocial('whatsapp')}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => shareOnSocial('telegram')}
              className="px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/50 text-sky-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Telegram</span>
            </button>
            <button
              onClick={() => shareOnSocial('twitter')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>X (Twitter)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Strict Compliance & Zero Investment Declaration Card */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              AG Creator Trust, Transparency & Compliance
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Built on uncompromising ethical standards and regulatory compliance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm mb-3">
              1
            </div>
            <h4 className="text-sm font-bold text-white">Zero Joining Fee</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              AG Creator is free to join and use. There are no registration fees, monthly subscription charges, or hidden maintenance costs.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm mb-3">
              2
            </div>
            <h4 className="text-sm font-bold text-white">No Investment Requirement</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              This product is not an investment scheme or financial deposit product. Users earn reward points strictly through voluntary referral activity and participation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm mb-3">
              3
            </div>
            <h4 className="text-sm font-bold text-white">No Guaranteed Income Claims</h4>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              We make zero promises of returns or financial compensation. Withdrawals are strictly disabled during early-access beta, pending ecosystem milestones and compliance verification.
            </p>
          </div>
        </div>

        <div className="mt-5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle size={16} className="shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Notice regarding Early Access Phase:</strong> All points earned are tracked in a cryptographic append-only Firestore ledger. Withdrawals remain disabled during beta.
          </p>
        </div>
      </section>

      {/* How AG Creator Referrals & Rewards Work in 3 Steps */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-white">How Referral & Rewards Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-emerald-400 font-extrabold text-sm mb-2">STEP 01</div>
            <h4 className="text-base font-bold text-white">Generate Your Unique Code</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              When you join, AG Creator assigns you a globally collision-checked referral code indexed directly in Firebase Firestore.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-teal-400 font-extrabold text-sm mb-2">STEP 02</div>
            <h4 className="text-base font-bold text-white">Share Across Any Device</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Invite friends using your link or code. They can sign up on Android (Kotlin Compose), iOS (SwiftUI), or Responsive Web.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="text-cyan-400 font-extrabold text-sm mb-2">STEP 03</div>
            <h4 className="text-base font-bold text-white">Server-Side Verified Ledger</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Referrals are verified against Firebase Security Rules and server logic. Reward points are ledger-recorded without client-controlled values.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
