import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  Smartphone,
  Apple,
  Globe,
  Lock,
  Layers,
  FileCode,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import blueprintConfig from '../../firebase-blueprint.json';

export const ArchitectureDocs: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'diagram' | 'blueprint' | 'security' | 'setup'>('diagram');

  const dirtyDozen = [
    { id: 1, title: 'Arbitrary Points Minting', status: 'BLOCKED', desc: 'Direct point additions blocked by ABAC write restrictions' },
    { id: 2, title: 'Withdrawal Status Tampering', status: 'BLOCKED', desc: 'withdrawalStatus is locked to LOCKED and immutable by clients' },
    { id: 3, title: 'Referral Code Collision / Hijacking', status: 'BLOCKED', desc: 'Document /referralCodes/{code} is write-once and checked for uniqueness' },
    { id: 4, title: 'Identity Spoofing on Profile Create', status: 'BLOCKED', desc: 'request.auth.uid must strictly match incoming().uid' },
    { id: 5, title: 'Blanket Profile Scraping', status: 'BLOCKED', desc: 'allow list: if false enforces zero user enumeration' },
    { id: 6, title: 'Cross-User Ledger Snooping', status: 'BLOCKED', desc: 'Ledger subcollections require isOwner(userId) access' },
    { id: 7, title: 'Fake Ledger Entry Injection', status: 'BLOCKED', desc: 'Ledger writes enforce strict event types and point caps' },
    { id: 8, title: 'Self-Referral Loop Attack', status: 'BLOCKED', desc: 'Server rejects referredByUid == uid invariants' },
    { id: 9, title: 'Oversized Payload / Denial of Wallet', status: 'BLOCKED', desc: 'All fields have strict .size() and regex boundaries' },
    { id: 10, title: 'Code Pattern Regex Bypass', status: 'BLOCKED', desc: 'Referral code must match ^[A-Z0-9]+$' },
    { id: 11, title: 'Policy Document Tampering', status: 'BLOCKED', desc: '/appConfig/compliance is strictly read-only' },
    { id: 12, title: 'Ghost Field / Shadow Key Injection', status: 'BLOCKED', desc: 'diff().affectedKeys().hasOnly() prevents shadow properties' },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/30">
            <Database size={13} />
            <span>Shared Firebase Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Cross-Platform Data Model & Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            ONEAG maintains a single source of truth across Web, Android, and iOS. Client codebases stay separate, but data models, referral rules, and rewards ledgers remain synchronized.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('diagram')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'diagram' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Data Flow
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'blueprint' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Schema IR
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'security' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Security Rules
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'setup' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            SDK Setup Guide
          </button>
        </div>
      </section>

      {/* Tab: Data Flow Diagram */}
      {activeTab === 'diagram' && (
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-emerald-400" />
            <span>Multi-Platform Topology</span>
          </h2>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-8">
            {/* Clients Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Globe size={20} />
                </div>
                <h4 className="font-bold text-white text-sm">Responsive Web Client</h4>
                <p className="text-[11px] text-slate-400 mt-1">React 19 + Vite + Tailwind</p>
                <span className="inline-block mt-2 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
                  firebase/auth + firestore
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-2">
                  <Smartphone size={20} />
                </div>
                <h4 className="font-bold text-white text-sm">Android Native Client</h4>
                <p className="text-[11px] text-slate-400 mt-1">Kotlin 2.0 + Jetpack Compose</p>
                <span className="inline-block mt-2 text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded font-mono">
                  firebase-auth-ktx + firestore-ktx
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-2">
                  <Apple size={20} />
                </div>
                <h4 className="font-bold text-white text-sm">iOS Client</h4>
                <p className="text-[11px] text-slate-400 mt-1">Swift 6 + SwiftUI</p>
                <span className="inline-block mt-2 text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-mono">
                  FirebaseAuth + FirebaseFirestore
                </span>
              </div>
            </div>

            {/* Connecting Arrows */}
            <div className="flex justify-center items-center gap-2 text-emerald-400 font-mono text-xs">
              <span>↓↓↓ Encrypted TLS 1.3 + Firebase Authentication Token ↓↓↓</span>
            </div>

            {/* Central Backend Node */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900 border-2 border-emerald-500/40 text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                <Database size={14} />
                <span>Single Shared Backend: Firebase Cloud Firestore</span>
              </div>
              <h3 className="text-xl font-bold text-white">Unified Ledger & Identity Architecture</h3>
              <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                Whether a user creates an account on an iPhone, refers a friend on Android, or checks their ledger on Web, they interact with the identical account record and verifiable Firestore transactions.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-left">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono block">/users/{'{uid}'}</span>
                  <span className="text-xs font-bold text-white">User Profile</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono block">/referralCodes/{'{code}'}</span>
                  <span className="text-xs font-bold text-white">Unique Code Registry</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono block">.../referrals/{'{refId}'}</span>
                  <span className="text-xs font-bold text-white">Referral Records</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono block">.../rewardsLedger/{'{id}'}</span>
                  <span className="text-xs font-bold text-white">Immutable Ledger</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab: Schema IR */}
      {activeTab === 'blueprint' && (
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCode size={18} className="text-emerald-400" />
                <span>firebase-blueprint.json (Intermediate Representation)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Defines the entities, field types, maxLength guards, and Firestore paths.
              </p>
            </div>
            <button
              onClick={() => handleCopy(JSON.stringify(blueprintConfig, null, 2))}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[500px] leading-relaxed">
            <code>{JSON.stringify(blueprintConfig, null, 2)}</code>
          </pre>
        </section>
      )}

      {/* Tab: Security & Dirty Dozen */}
      {activeTab === 'security' && (
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <span>Firestore ABAC Hardening & Adversarial Test Matrix</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All 12 "Dirty Dozen" attack vectors have been verified and sealed in firestore.rules.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dirtyDozen.map((test) => (
              <div
                key={test.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
              >
                <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 mt-0.5 shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{test.title}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {test.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{test.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Setup Guide */}
      {activeTab === 'setup' && (
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white">Cross-Platform Deployment Instructions</h2>

          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-emerald-400">1. Android Configuration (Kotlin Compose)</h4>
              <p className="text-slate-400">
                1. Place the generated <code className="text-white font-mono">google-services.json</code> inside your Android project root at <code className="text-white font-mono">app/google-services.json</code>.
                <br />
                2. Apply the Google Services Gradle plugin in <code className="text-white font-mono">app/build.gradle.kts</code>:
              </p>
              <pre className="p-3 bg-slate-900 rounded-lg font-mono text-emerald-300">
id("com.google.gms.google-services")
              </pre>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-emerald-400">2. iOS Configuration (SwiftUI)</h4>
              <p className="text-slate-400">
                1. Add <code className="text-white font-mono">GoogleService-Info.plist</code> into your Xcode project under the ONEAG target.
                <br />
                2. Initialize Firebase in your SwiftUI App:
              </p>
              <pre className="p-3 bg-slate-900 rounded-lg font-mono text-emerald-300">
{`import FirebaseCore

@main
struct ONEAGApp: App {
    init() {
        FirebaseApp.configure()
    }
    var body: some Scene { WindowGroup { MainTabView() } }
}`}
              </pre>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
