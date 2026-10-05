import React, { useState, useEffect } from 'react';
import {
  Coins,
  Gift,
  Lock,
  Award,
  CalendarCheck,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { RewardsLedger, LoyaltyTier, UserWallet } from '../types';
import { subscribeToRewardsLedger, claimDailyStreakReward, subscribeToUserWallet } from '../services/referralService';

export const RewardsView: React.FC = () => {
  const { currentUser, userProfile, setAuthModalOpen } = useAuth();
  const [ledgerEntries, setLedgerEntries] = useState<RewardsLedger[]>([]);
  const [loadingLedger, setLoadingLedger] = useState<boolean>(true);
  const [claimingStreak, setClaimingStreak] = useState<boolean>(false);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [streakStatus, setStreakStatus] = useState<{ message: string; type: 'success' | 'error' | null }>({
    message: '',
    type: null
  });
  const [showWithdrawalModal, setShowWithdrawalModal] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUser) {
      setLedgerEntries([]);
      setWallet(null);
      setLoadingLedger(false);
      return;
    }

    const unsubLedger = subscribeToRewardsLedger(currentUser.uid, (entries) => {
      setLedgerEntries(entries);
      setLoadingLedger(false);
    });

    const unsubWallet = subscribeToUserWallet(currentUser.uid, (w) => {
      setWallet(w);
    });

    return () => {
      unsubLedger();
      unsubWallet();
    };
  }, [currentUser]);

  const handleClaimStreak = async () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    setClaimingStreak(true);
    setStreakStatus({ message: '', type: null });

    try {
      const res = await claimDailyStreakReward(currentUser.uid);
      if (res.success) {
        setStreakStatus({ message: res.message, type: 'success' });
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#14B8A6', '#F59E0B']
        });
      } else {
        setStreakStatus({ message: res.message, type: 'error' });
      }
    } catch {
      setStreakStatus({ message: 'Failed to claim daily reward. Try again.', type: 'error' });
    } finally {
      setClaimingStreak(false);
    }
  };

  const getTierProgress = (tier?: LoyaltyTier, count: number = 0) => {
    switch (tier) {
      case 'Platinum':
        return { current: count, target: 25, percentage: 100, next: 'Maximum Tier' };
      case 'Gold':
        return { current: count, target: 25, percentage: Math.min(100, Math.round((count / 25) * 100)), next: 'Platinum (25 Referrals)' };
      case 'Silver':
        return { current: count, target: 10, percentage: Math.min(100, Math.round((count / 10) * 100)), next: 'Gold (10 Referrals)' };
      default:
        return { current: count, target: 3, percentage: Math.min(100, Math.round((count / 3) * 100)), next: 'Silver (3 Referrals)' };
    }
  };

  const tierInfo = getTierProgress(userProfile?.tier, userProfile?.totalReferrals || 0);

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Top Banner & Balance */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-3 border border-amber-500/30">
              <Gift size={13} />
              <span>Verified Rewards & Ledger Center</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Your Rewards Balance
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Every point credited is secured inside an append-only Firestore ledger. Zero joining fee, zero investment requirement, zero artificial inflation.
            </p>
          </div>

          {/* Points Card */}
          <div className="p-6 bg-slate-950/80 border border-slate-800 rounded-3xl shrink-0 min-w-[280px] text-right sm:text-left space-y-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Available Balance
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <Coins size={28} className="text-amber-400 shrink-0" />
                <span className="text-4xl font-black text-white">
                  {wallet?.availableBalance ?? userProfile?.pointsBalance ?? 0}
                </span>
                <span className="text-xs font-bold text-amber-400 uppercase">PTS</span>
              </div>
            </div>

            {/* Pending Balance from Return-Window Validation */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock size={12} className="text-amber-400" /> Pending Hold:
              </span>
              <span className="font-bold text-amber-300">
                {wallet?.pendingBalance ?? 0} PTS
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
              <span className="text-slate-400">Ledger Status:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={13} /> Synchronized
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Streak & Withdrawal Lock Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Streak Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CalendarCheck size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Daily Check-In Bonus</h3>
                <p className="text-xs text-slate-400">Server-validated bonus once every 24 hours</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
              DAILY BONUS
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Consistently using AG Creator grows your rewards ledger. Updates are timestamped and verified server-side.
          </p>

          {streakStatus.message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                streakStatus.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
              }`}
            >
              {streakStatus.type === 'success' ? (
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle size={15} className="shrink-0 text-amber-400" />
              )}
              <span>{streakStatus.message}</span>
            </div>
          )}

          <button
            onClick={handleClaimStreak}
            disabled={claimingStreak}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>{claimingStreak ? 'Verifying with server...' : 'Claim Daily Check-In Bonus'}</span>
          </button>
        </div>

        {/* Withdrawal Disabled Card (MANDATORY REQUIREMENT) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Points Withdrawal</h3>
                <p className="text-xs text-slate-400">Early access policy status</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5">
              <Lock size={12} className="text-amber-400" />
              LOCKED (BETA)
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">Withdrawals are currently locked during early access phase.</strong> In accordance with our compliance guarantee (no joining fee, zero investment requirement), points cannot be cashed out until the ecosystem unlocks.
          </p>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Withdrawal Policy:</span>
              <span className="font-semibold text-slate-300">Disabled (Beta)</span>
            </div>
            <div className="flex justify-between">
              <span>Joining Fee / Financial Deposit:</span>
              <span className="font-semibold text-emerald-400">Strictly $0 (None)</span>
            </div>
          </div>

          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <HelpCircle size={14} />
            <span>Read Early Access Withdrawal Policy</span>
          </button>
        </div>
      </section>

      {/* Tier Roadmap Progression */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Award size={20} className="text-emerald-400" />
              <span>AG Creator Loyalty Tier Progression</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Your tier automatically upgrades as verified referrals join through your link
            </p>
          </div>
          <div className="text-right sm:text-left">
            <span className="text-xs text-slate-400">Next milestone: </span>
            <span className="text-xs font-bold text-emerald-400">{tierInfo.next}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${tierInfo.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Current: {userProfile?.totalReferrals || 0} referrals</span>
            <span>{tierInfo.percentage}% to next milestone</span>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div
            className={`p-4 rounded-2xl border transition ${
              userProfile?.tier === 'Bronze'
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider">Bronze</div>
            <div className="text-lg font-extrabold text-white mt-1">0 - 2 Refs</div>
            <p className="text-[11px] mt-1 text-slate-400">Base member tier</p>
          </div>

          <div
            className={`p-4 rounded-2xl border transition ${
              userProfile?.tier === 'Silver'
                ? 'bg-slate-800/60 border-slate-400/50 text-slate-100'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider">Silver</div>
            <div className="text-lg font-extrabold text-white mt-1">3 - 9 Refs</div>
            <p className="text-[11px] mt-1 text-slate-400">Early access perks & badge</p>
          </div>

          <div
            className={`p-4 rounded-2xl border transition ${
              userProfile?.tier === 'Gold'
                ? 'bg-amber-900/30 border-amber-400/50 text-amber-200'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider">Gold</div>
            <div className="text-lg font-extrabold text-white mt-1">10 - 24 Refs</div>
            <p className="text-[11px] mt-1 text-slate-400">Priority standing</p>
          </div>

          <div
            className={`p-4 rounded-2xl border transition ${
              userProfile?.tier === 'Platinum'
                ? 'bg-purple-950/30 border-purple-400/50 text-purple-200'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="text-xs font-bold uppercase tracking-wider">Platinum</div>
            <div className="text-lg font-extrabold text-white mt-1">25+ Refs</div>
            <p className="text-[11px] mt-1 text-slate-400">VIP ambassador standing</p>
          </div>
        </div>
      </section>

      {/* Real-time Server-Side Rewards Ledger */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-emerald-400" />
              <span>Immutable Rewards Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live cryptographic stream from Firestore subcollection <code className="text-slate-300 font-mono text-[10px]">/users/{'{uid}'}/rewardsLedger</code>
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {ledgerEntries.length} total ledger entries
          </span>
        </div>

        {!currentUser ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60">
            <Clock size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Sign in to view your ledger</p>
            <p className="text-xs text-slate-500 mt-1">
              Your points history is recorded immutably on Firestore.
            </p>
          </div>
        ) : loadingLedger ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Streaming ledger records...
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60">
            <Gift size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No ledger activity yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Refer a friend or claim your daily check-in above to create your first verified ledger entry!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Points</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {entry.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 text-sm">
                      +{entry.amount}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Withdrawal Explainer Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Early Access Withdrawal Policy</h3>
                <p className="text-xs text-slate-400">AG Creator Regulatory & Compliance Standard</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>Why are withdrawals disabled initially?</strong>
                <br />
                AG Creator operates under strict compliance guidelines. During this early beta phase, our primary objective is verifying ecosystem health, network authenticity, and multi-platform balance integrity across Android, iOS, and Web.
              </p>
              <p>
                <strong>Zero Financial Risk:</strong>
                <br />
                No user is ever asked to pay a joining fee or deposit capital. Because no money is invested, your participation involves zero financial risk.
              </p>
              <p>
                <strong>Withdrawal Policy:</strong>
                <br />
                Withdrawals remain strictly locked in the codebase during early access beta.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck size={16} className="shrink-0" />
              <span>All points earned remain permanently recorded on your Firestore ledger.</span>
            </div>

            <button
              onClick={() => setShowWithdrawalModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
