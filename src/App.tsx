/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ShopView } from './components/ShopView';
import { ReferEarnView } from './components/ReferEarnView';
import { RewardsView } from './components/RewardsView';
import { ProfileView } from './components/ProfileView';
import { AndroidPreview } from './components/AndroidPreview';
import { IOSPreview } from './components/IOSPreview';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { AdminDashboard } from './components/AdminDashboard';
import { CreatorWorkspace } from './components/CreatorWorkspace';
import { AuthModal } from './components/AuthModal';
import { TabType, PlatformView } from './types';
import { ShieldCheck, Lock, Smartphone, Apple, Globe, Database, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('creator');
  const [platformView, setPlatformView] = useState<PlatformView>('web');
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navbar with Multiplatform Switcher */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        platformView={platformView}
        onPlatformChange={setPlatformView}
      />

      {/* Main Container */}
      <main className="creator-main-container flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
        {platformView === 'web' && (
          <>
            {currentTab === 'creator' && <CreatorWorkspace />}
            {currentTab === 'home' && (
              <HomeView onTabChange={setCurrentTab} onPlatformChange={setPlatformView} />
            )}
            {currentTab === 'shop' && <ShopView onTabChange={setCurrentTab} />}
            {currentTab === 'refer' && <ReferEarnView />}
            {currentTab === 'rewards' && <RewardsView />}
            {currentTab === 'profile' && <ProfileView />}
            {currentTab === 'admin' && <AdminDashboard />}
          </>
        )}

        {platformView === 'android' && <AndroidPreview />}
        {platformView === 'ios' && <IOSPreview />}
        {platformView === 'architecture' && <ArchitectureDocs />}
        {platformView === 'admin' && <AdminDashboard />}
      </main>

      {/* Global Regulatory Footer */}
      {currentTab === 'creator' ? (
        <footer className="border-t border-slate-900 bg-slate-950 px-4 py-6 text-center text-xs text-slate-500">
          AG Creator · Your all-in-one creative workspace
        </footer>
      ) : (
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 py-10 px-4 sm:px-6 text-xs mt-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-sm border border-emerald-500/30">
                AG
              </div>
              <div>
                <p className="font-bold text-white text-sm">AG Creator Product Architecture</p>
                <p className="text-[11px] text-slate-500">
                  Cross-Platform Referral & Rewards • Web, Android & iOS
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <button
                onClick={() => setPlatformView('web')}
                className="hover:text-emerald-400 transition"
              >
                Web App
              </button>
              <button
                onClick={() => setPlatformView('android')}
                className="hover:text-emerald-400 transition"
              >
                Android Native
              </button>
              <button
                onClick={() => setPlatformView('ios')}
                className="hover:text-emerald-400 transition"
              >
                iOS Client
              </button>
              <button
                onClick={() => setPlatformView('architecture')}
                className="hover:text-emerald-400 transition"
              >
                Security & Rules
              </button>
              <button
                onClick={() => setPlatformView('admin')}
                className="hover:text-emerald-400 transition text-emerald-400/90 font-medium"
              >
                Admin Console
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-slate-300">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Mandatory Regulatory & Ethical Compliance Declarations:</span>
            </div>
            <p>
              <strong>1. Zero Joining Fee:</strong> ONEAG is 100% free to join, register, and participate in. No payment is ever required.
            </p>
            <p>
              <strong>2. No Investment Requirement:</strong> This platform is neither an investment vehicle nor a securities offering. No money can be deposited. Points are accrued solely through voluntary participation and verified referral invites.
            </p>
            <p>
              <strong>3. No Guaranteed Income Claims:</strong> Points are loyalty reward units without speculative return promises. Withdrawals are strictly disabled during this early-access beta phase.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 pt-2 border-t border-slate-900">
            <span>© 2026 AG Creator. Built with Firebase Auth, Cloud Firestore & Multi-Platform Clients.</span>
            <span>All Firestore rules hardened with Attribute-Based Access Control (ABAC).</span>
          </div>
        </div>
      </footer>
      )}

      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
