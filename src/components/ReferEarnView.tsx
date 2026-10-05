import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Users,
  Coins,
  ShieldCheck,
  ExternalLink,
  Smartphone,
  Globe,
  Apple,
  Sparkles,
  Info,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ReferralRecord } from '../types';
import { subscribeToReferrals } from '../services/referralService';
import { ONEAG_REFERRAL_BASE_URL } from '../config';

export const ReferEarnView: React.FC = () => {
  const { currentUser, userProfile, setAuthModalOpen } = useAuth();
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState<boolean>(true);

  // Real unique referral code from Firebase.
  // Referral link resolves dynamically to the current app URL.
  const referralCode = userProfile?.referralCode || '';
  const referralLink = referralCode ? `${ONEAG_REFERRAL_BASE_URL}/?ref=${referralCode}` : '';

  useEffect(() => {
    if (!currentUser) {
      setReferrals([]);
      setLoadingReferrals(false);
      return;
    }

    const unsubscribe = subscribeToReferrals(currentUser.uid, (records) => {
      setReferrals(records);
      setLoadingReferrals(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

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

  const shareNative = async () => {
    if (!referralCode) {
      setAuthModalOpen(true);
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join AG Creator',
          text: `Join AG Creator with my referral code ${referralCode}. No joining fee or investment required:`,
          url: referralLink,
        });
      } catch {
        // Fallback
      }
    } else {
      handleCopyLink();
    }
  };

  const shareSocial = (platform: 'whatsapp' | 'telegram' | 'twitter' | 'email') => {
    if (!referralCode) {
      setAuthModalOpen(true);
      return;
    }
    const text = `Join AG Creator with my referral code ${referralCode} to participate in our verified rewards program. No joining fee: ${referralLink}`;
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'email') {
      window.open(`mailto:?subject=${encodeURIComponent('Join AG Creator')}&body=${encodeURIComponent(text)}`);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/30">
              <Share2 size={13} />
              <span>Multi-Platform Referral Program</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Refer Friends & Grow Your Ledger
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Share your universal referral link with colleagues and friends across Web, Android, or iOS. All referral attributions and reward ledger entries are strictly validated server-side.
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-slate-950/80 border border-slate-800 rounded-2xl shrink-0 min-w-[240px]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Referral Verification
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-400">Server-Side</span>
              <span className="text-xs font-bold text-slate-400 uppercase">LEDGER</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Zero client-controlled reward amounts
            </p>
          </div>
        </div>
      </section>

      {/* Main Referral Toolkit */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code, Link, Share buttons (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-400" />
              <span>Your Unique Referral Credentials</span>
            </h2>

            {/* Referral Code Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Your Exclusive Referral Code
              </label>
              <div className="flex items-center gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                <div className="flex-1 font-mono text-xl sm:text-2xl font-black text-emerald-400 tracking-wider">
                  {referralCode || (currentUser ? 'SYNCING WITH FIREBASE...' : 'SIGN IN TO VIEW CODE')}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Referral Link Box */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Universal Referral Link
              </label>
              <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <input
                  type="text"
                  readOnly
                  value={referralLink || 'Sign in to generate referral link'}
                  className="flex-1 bg-transparent text-xs sm:text-sm text-slate-300 font-mono focus:outline-none truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
                {referralCode && (
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0 cursor-pointer"
                    title="View QR Code"
                  >
                    <QrCode size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Social Share Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Direct Sharing Channels
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => shareSocial('whatsapp')}
                  className="p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => shareSocial('telegram')}
                  className="p-3 rounded-xl bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/40 text-sky-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Telegram</span>
                </button>
                <button
                  onClick={() => shareSocial('twitter')}
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>X (Twitter)</span>
                </button>
                <button
                  onClick={shareNative}
                  className="p-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/40 text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>Share All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Server-Side Validation & Security Assurance */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>Server-Side Referral Verification Invariants</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Global Uniqueness:</strong> Referral codes are registered in dedicated index (/referralCodes) to prevent collisions.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Anti-Self-Referral Gate:</strong> Users cannot refer themselves (referrerUserId != referredUserId).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Duplicate Referral Lock:</strong> A referee can only be attributed once. Tracked globally at /referrals/{'{referredUserId}'}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Zero Client-Controlled Rewards:</strong> Reward points are calculated strictly server-side and recorded in an immutable ledger.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Real-Time Referrals Subcollection List (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users size={18} className="text-emerald-400" />
                  <span>Your Referred Network</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time verified referrals subcollection
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                {referrals.length} Verified
              </span>
            </div>

            {!currentUser ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60">
                <Users size={32} className="text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-slate-300">Sign in to track your referrals</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  See real-time stats of friends who join using your code.
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition cursor-pointer"
                >
                  Sign In Now
                </button>
              </div>
            ) : loadingReferrals ? (
              <div className="flex-1 flex items-center justify-center p-12 text-slate-500 text-xs">
                Loading referral network...
              </div>
            ) : referrals.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60">
                <Users size={32} className="text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-slate-300">No referrals yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Share your link with your network to begin building your verified referral records.
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
                {referrals.map((ref) => (
                  <div
                    key={ref.rewardLedgerId || ref.referredUserId}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                        {ref.platform === 'android' ? (
                          <Smartphone size={14} />
                        ) : ref.platform === 'ios' ? (
                          <Apple size={14} />
                        ) : (
                          <Globe size={14} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Referee: {ref.referredUserId.slice(0, 8)}...
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={10} />
                          <span>{new Date(ref.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="uppercase">{ref.platform}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {ref.status === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 size={12} />
                          <span>VERIFIED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <Clock size={10} />
                          <span>Attributed (Pending)</span>
                        </span>
                      )}
                      <span className="block text-[9px] text-slate-500 mt-0.5">
                        {ref.status === 'VERIFIED' ? 'Reward Credited' : 'Awaiting qualifying activity'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* QR Code Modal */}
      {showQrModal && referralCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-white shadow-2xl">
            <h3 className="text-lg font-bold">Your Referral QR Code</h3>
            <p className="text-xs text-slate-400 mt-1">
              Scan with camera on Android or iPhone to join with {referralCode}
            </p>

            <div className="my-6 p-4 bg-white rounded-2xl inline-block shadow-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  referralLink
                )}`}
                alt="Referral QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <p className="font-mono text-xs text-emerald-400 font-bold mb-4">{referralCode}</p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
