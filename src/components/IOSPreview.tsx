import React, { useState } from 'react';
import {
  Apple,
  Code2,
  Copy,
  Check,
  Share2,
  Coins,
  Gift,
  User,
  Home,
  Lock,
  Wifi,
  Battery,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TabType } from '../types';

export const IOSPreview: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [phoneTab, setPhoneTab] = useState<TabType>('home');
  const [selectedFile, setSelectedFile] = useState<'ONEAGApp' | 'ReferEarnView' | 'RewardsView' | 'FirebaseService' | 'Plist'>('ReferEarnView');
  const [copied, setCopied] = useState<boolean>(false);

  const referralCode = userProfile?.referralCode || '';
  const points = userProfile?.pointsBalance ?? 0;

  const codeSnippets: Record<string, { filename: string; language: string; content: string }> = {
    ReferEarnView: {
      filename: 'ReferEarnView.swift',
      language: 'swift',
      content: `import SwiftUI

struct ReferEarnView: View {
    @ObservedObject var viewModel: ONEAGViewModel
    @State private var copied: Bool = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Refer & Earn")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Text("Share your unique code across iOS, Android, and Web to earn +150 points.")
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    
                    // Code Card
                    VStack(spacing: 16) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text("YOUR EXCLUSIVE CODE")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.secondary)
                                Text(viewModel.userProfile?.referralCode.isEmpty == false ? viewModel.userProfile!.referralCode : "SYNCING...")
                                    .font(.system(size: 24, weight: .black, design: .monospaced))
                                    .foregroundColor(.green)
                            }
                            Spacer()
                            Button {
                                UIPasteboard.general.string = viewModel.userProfile?.referralCode ?? ""
                                copied = true
                            } label: {
                                Image(systemName: copied ? "checkmark" : "doc.on.doc")
                                    .foregroundColor(.white)
                                    .padding(10)
                                    .background(Color.white.opacity(0.1))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                        }
                        .padding()
                        .background(Color(red: 0.05, green: 0.08, blue: 0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        
                        // iOS Native ShareLink
                        let code = viewModel.userProfile?.referralCode ?? ""
                        let shareURL = URL(string: "https://oneag.app/?ref=\(code)")!
                        ShareLink(
                            item: shareURL,
                            message: Text("Join ONEAG with my referral code \(code): \(shareURL) (Zero joining fee, no investment required)")
                        ) {
                            HStack {
                                Image(systemName: "square.and.arrow.up")
                                Text("Share Invite Link")
                                    .fontWeight(.bold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.black)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                        }
                    }
                    .padding()
                    .background(Color(red: 0.09, green: 0.12, blue: 0.2))
                    .clipShape(RoundedRectangle(cornerRadius: 22))
                    .padding(.horizontal)
                    
                    // Referred Friends List
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Referred Friends (\\(viewModel.referrals.count))")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        ForEach(viewModel.referrals) { referral in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(referral.referredEmailMasked)
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.white)
                                    Text("Status: \\(referral.status)")
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Text("+\\(referral.rewardPoints) PTS")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                            }
                            .padding()
                            .background(Color(red: 0.09, green: 0.12, blue: 0.2))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .padding(.horizontal)
                        }
                    }
                }
                .padding(.top)
            }
            .background(Color(red: 0.04, green: 0.06, blue: 0.1).ignoresSafeArea())
        }
    }
}`
    },
    RewardsView: {
      filename: 'RewardsView.swift',
      language: 'swift',
      content: `import SwiftUI

struct RewardsView: View {
    @ObservedObject var viewModel: ONEAGViewModel
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Balance Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("AVAILABLE POINTS")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.secondary)
                        Text("\\(viewModel.userProfile?.pointsBalance ?? 0) PTS")
                            .font(.system(size: 38, weight: .black, design: .rounded))
                            .foregroundColor(.green)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color(red: 0.09, green: 0.12, blue: 0.2))
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .padding(.horizontal)
                    
                    // Locked Withdrawal Card (Compliance Mandate)
                    HStack(spacing: 14) {
                        Image(systemName: "lock.fill")
                            .font(.title2)
                            .foregroundColor(.orange)
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Withdrawals Locked (Early Access)")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            Text("Zero investment required. Minimum 1,000 points threshold and KYC will apply when unlocked.")
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                    }
                    .padding()
                    .background(Color(red: 0.13, green: 0.17, blue: 0.26))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .padding(.horizontal)
                    
                    // Ledger
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Immutable Ledger History")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        ForEach(viewModel.ledger) { entry in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(entry.description)
                                        .font(.subheadline)
                                        .foregroundColor(.white)
                                    Text(entry.type)
                                        .font(.caption2)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Text("+\\(entry.amount) PTS")
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                            }
                            .padding()
                            .background(Color(red: 0.09, green: 0.12, blue: 0.2))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .padding(.horizontal)
                        }
                    }
                }
            }
            .background(Color(red: 0.04, green: 0.06, blue: 0.1).ignoresSafeArea())
            .navigationTitle("Rewards")
        }
    }
}`
    },
    FirebaseService: {
      filename: 'FirebaseService.swift',
      language: 'swift',
      content: `import Foundation
import FirebaseCore
import FirebaseAuth
import FirebaseFirestore

@MainActor
class FirebaseService: ObservableObject {
    @Published var currentUser: User?
    @Published var userProfile: UserProfile?
    @Published var referrals: [ReferralRecord] = []
    @Published var ledger: [RewardsLedger] = []
    
    private let db = Firestore.firestore()
    private var profileListener: ListenerRegistration?
    
    init() {
        Auth.auth().addStateDidChangeListener { [weak self] _, user in
            self?.currentUser = user
            if let uid = user?.uid {
                self?.listenToUserProfile(uid: uid)
                self?.listenToReferrals(uid: uid)
                self?.listenToLedger(uid: uid)
            }
        }
    }
    
    func listenToUserProfile(uid: String) {
        profileListener = db.collection("users").document(uid)
            .addSnapshotListener { snapshot, error in
                guard let data = snapshot?.data(), error == nil else { return }
                self.userProfile = try? Firestore.Decoder().decode(UserProfile.self, from: data)
            }
    }
    
    func listenToReferrals(uid: String) {
        db.collection("users").document(uid).collection("referrals")
            .order(by: "createdAt", descending: true)
            .addSnapshotListener { snapshot, _ in
                self.referrals = snapshot?.documents.compactMap {
                    try? $0.data(as: ReferralRecord.self)
                } ?? []
            }
    }
    
    func listenToLedger(uid: String) {
        db.collection("users").document(uid).collection("rewardsLedger")
            .order(by: "createdAt", descending: true)
            .addSnapshotListener { snapshot, _ in
                self.ledger = snapshot?.documents.compactMap {
                    try? $0.data(as: RewardsLedger.self)
                } ?? []
            }
    }
}

// MARK: - Provider-Agnostic Shopping & Transaction Architecture Models

struct Product: Codable, Identifiable {
    var id: String { productId }
    let productId: String
    let provider: String // "amazon", "flipkart", "myntra"
    let externalProductId: String
    let title: String
    let description: String?
    let imageUrl: String
    let productUrl: String
    let category: String
    let price: Double
    let currency: String
    let availability: String
    let trackingId: String?
    let lastUpdated: String
}

struct AffiliateTransaction: Codable, Identifiable {
    var id: String { transactionId }
    let transactionId: String
    let userId: String
    let referrerUserId: String?
    let referralRecordId: String?
    let partnerId: String
    let productId: String
    let clickId: String
    let trackingId: String
    let purchaseAmount: Double
    let commissionAmount: Double
    let rewardAmount: Int
    let transactionStatus: String // "PENDING", "CONFIRMED", "CANCELLED", "REFUNDED"
    let refundStatus: String
    let createdAt: String
    let updatedAt: String
}

struct AdminOverviewMetrics: Codable {
    let totalRegisteredUsers: Int
    let verifiedReferrals: Int
    let pendingRewards: Int
    let confirmedRewards: Int
    let affiliateClicks: Int
    let confirmedAffiliateTransactions: Int
    let cancelledTransactions: Int
    let refundedTransactions: Int
}

struct AdminAuditLog: Codable, Identifiable {
    var id: String { logId }
    let logId: String
    let timestamp: String
    let adminEmail: String
    let actionType: String
    let targetResource: String
    let description: String
    let status: String
}`
    },
    ONEAGApp: {
      filename: 'ONEAGApp.swift',
      language: 'swift',
      content: `import SwiftUI
import FirebaseCore

@main
struct ONEAGApp: App {
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .preferredColorScheme(.dark)
        }
    }
}`
    },
    Plist: {
      filename: 'GoogleService-Info.plist',
      language: 'xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CLIENT_ID</key>
	<string>89251464184-aitra74hbtisdkdafstmho68argq36vq.apps.googleusercontent.com</string>
	<key>API_KEY</key>
	<string>AIzaSyBPE3_mYJDo6UxlUZPgFtUbRyPQd6iuGJs</string>
	<key>GCM_SENDER_ID</key>
	<string>89251464184</string>
	<key>PLIST_VERSION</key>
	<string>1</string>
	<key>BUNDLE_ID</key>
	<string>com.oneag.ios</string>
	<key>PROJECT_ID</key>
	<string>oneag-b9739</string>
	<key>STORAGE_BUCKET</key>
	<string>oneag-b9739.firebasestorage.app</string>
	<key>IS_ADS_ENABLED</key>
	<false></false>
	<key>IS_ANALYTICS_ENABLED</key>
	<false></false>
	<key>IS_APPINVITE_ENABLED</key>
	<true></true>
	<key>IS_GCM_ENABLED</key>
	<true></true>
	<key>IS_SIGNIN_ENABLED</key>
	<true></true>
	<key>GOOGLE_APP_ID</key>
	<string>1:89251464184:ios:f4c82d1916285da1404c0d</string>
</dict>
</plist>`
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[selectedFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header Banner */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Apple size={13} />
            <span>Native iOS Client</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Swift & SwiftUI Implementation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Clean Swift architecture utilizing NavigationStack, ShareLink, Apple's Human Interface Guidelines, and Firestore real-time snapshot listeners.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Apple size={14} />
            <span>iPhone 16 Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'code'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 size={14} />
            <span>Swift Source Code</span>
          </button>
        </div>
      </section>

      {/* Main Content */}
      {activeTab === 'preview' ? (
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-4">
          {/* iPhone Frame */}
          <div className="w-[340px] sm:w-[360px] h-[720px] bg-black rounded-[54px] border-[10px] border-slate-800 shadow-2xl overflow-hidden flex flex-col relative">
            {/* Dynamic Island & Status Bar */}
            <div className="h-10 bg-black px-6 flex items-center justify-between text-[11px] text-white select-none z-10 shrink-0">
              <span className="font-semibold text-xs">9:41</span>
              {/* Dynamic Island pill */}
              <div className="w-24 h-6 rounded-full bg-black border border-slate-900 mx-auto flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] mr-3" />
                <div className="w-2 h-2 rounded-full bg-[#151525]" />
              </div>
              <div className="flex items-center gap-1.5">
                <Wifi size={12} />
                <Battery size={14} />
              </div>
            </div>

            {/* iOS Screen View */}
            <div className="flex-1 overflow-y-auto bg-[#080b12] p-4 text-white text-xs select-none">
              {phoneTab === 'home' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ONEAG iOS</span>
                      <h3 className="text-xl font-bold text-white">Welcome, {userProfile?.displayName || 'Member'}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      1AG
                    </div>
                  </div>

                  {/* iOS Style Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-md space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Available Points</span>
                    <div className="text-3xl font-black text-emerald-400">{points} PTS</div>
                    <p className="text-[10px] text-slate-400">Tier: {userProfile?.tier || 'Bronze'}</p>
                  </div>

                  {/* Share Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Unique Code</span>
                    <div className="p-2.5 bg-slate-950 rounded-xl text-center font-mono font-black text-lg text-emerald-400">
                      {referralCode || (currentUser ? 'SYNCING...' : 'SIGN IN REQUIRED')}
                    </div>
                    <button
                      onClick={() => setPhoneTab('refer')}
                      className="w-full py-2.5 bg-emerald-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <Share2 size={13} />
                      <span>ShareLink iOS Sheet</span>
                    </button>
                  </div>

                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-400">
                    <Lock size={12} className="text-amber-400" />
                    <span>Withdrawals disabled in Beta. Zero joining fee.</span>
                  </div>
                </div>
              )}

              {phoneTab === 'refer' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Refer & Earn</h3>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Your Referral Code</span>
                    <div className="text-xl font-mono font-black text-emerald-400 text-center py-2 bg-slate-950 rounded-xl">
                      {referralCode}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Network Count</span>
                    <p className="text-sm font-bold text-white mt-1">
                      {userProfile?.totalReferrals ?? 0} Verified Referrals
                    </p>
                  </div>
                </div>
              )}

              {phoneTab === 'rewards' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Rewards & Ledger</h3>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Balance</span>
                    <p className="text-2xl font-black text-emerald-400">{points} PTS</p>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-[11px] text-amber-300">
                    <Lock size={14} className="shrink-0" />
                    <span>Withdrawals locked during beta phase. Zero investment required.</span>
                  </div>
                </div>
              )}

              {phoneTab === 'profile' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Account Profile</h3>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                    <p className="font-bold text-sm text-white">{userProfile?.displayName || 'User'}</p>
                    <p className="text-[11px] text-slate-400">{currentUser?.email || 'user@oneag.internal'}</p>
                    <p className="text-[10px] text-emerald-400 font-mono mt-1">Code: {referralCode}</p>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0" />
                    <span>Cross-Platform Firestore Synchronized</span>
                  </div>
                </div>
              )}
            </div>

            {/* iOS Bottom Tab Bar */}
            <div className="h-16 bg-slate-950/95 border-t border-slate-900 px-6 flex items-center justify-around text-slate-400 shrink-0">
              <button
                onClick={() => setPhoneTab('home')}
                className={`flex flex-col items-center gap-1 ${phoneTab === 'home' ? 'text-emerald-400' : ''}`}
              >
                <Home size={18} />
                <span className="text-[9px]">Home</span>
              </button>
              <button
                onClick={() => setPhoneTab('refer')}
                className={`flex flex-col items-center gap-1 ${phoneTab === 'refer' ? 'text-emerald-400' : ''}`}
              >
                <Share2 size={18} />
                <span className="text-[9px]">Refer</span>
              </button>
              <button
                onClick={() => setPhoneTab('rewards')}
                className={`flex flex-col items-center gap-1 ${phoneTab === 'rewards' ? 'text-emerald-400' : ''}`}
              >
                <Gift size={18} />
                <span className="text-[9px]">Rewards</span>
              </button>
              <button
                onClick={() => setPhoneTab('profile')}
                className={`flex flex-col items-center gap-1 ${phoneTab === 'profile' ? 'text-emerald-400' : ''}`}
              >
                <User size={18} />
                <span className="text-[9px]">Profile</span>
              </button>
            </div>
          </div>

          {/* iOS Highlights */}
          <div className="max-w-md space-y-4 text-xs text-slate-300">
            <h3 className="text-base font-bold text-white">iOS SwiftUI Highlights</h3>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400">SwiftUI ShareLink:</span>
              <p className="text-slate-400 leading-relaxed">
                Uses the latest iOS 16+ <code className="text-emerald-300 font-mono">ShareLink</code> API to open the native iOS share sheet directly with AirDrop, Messages, and social apps.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400">Declarative Concurrency:</span>
              <p className="text-slate-400 leading-relaxed">
                Uses Swift modern <code className="text-emerald-300 font-mono">@MainActor</code> and <code className="text-emerald-300 font-mono">ObservableObject</code> for zero-flicker UI updates when Firestore emits changes.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400">Same Shared Firebase Backend:</span>
              <p className="text-slate-400 leading-relaxed">
                Points, referrals, and user auth stay identical whether the user accesses ONEAG from an iPhone, an Android device, or a desktop browser.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Source Code Viewer */
        <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(codeSnippets) as Array<keyof typeof codeSnippets>).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedFile(key as 'FirebaseService' | 'ONEAGApp' | 'Plist' | 'ReferEarnView' | 'RewardsView')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                    selectedFile === key
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {codeSnippets[key].filename}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>
          </div>

          <pre className="p-6 text-xs font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed">
            <code>{codeSnippets[selectedFile].content}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
