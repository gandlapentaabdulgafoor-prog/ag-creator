import React from 'react';
import {
  Coins,
  Gift,
  User as UserIcon,
  Home,
  Share2,
  Smartphone,
  Globe,
  Apple,
  Database,
  Lock,
  LogOut,
  ChevronDown,
  ShoppingBag,
  ShieldCheck,
  WandSparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TabType, PlatformView } from '../types';
import { checkIsAdmin } from '../services/adminService';

interface NavbarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  platformView: PlatformView;
  onPlatformChange: (view: PlatformView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  platformView,
  onPlatformChange
}) => {
  const { currentUser, userProfile, setAuthModalOpen, logout } = useAuth();
  const [profileDropdown, setProfileDropdown] = React.useState(false);

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Platinum':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Gold':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Silver':
        return 'bg-slate-300/20 text-slate-200 border-slate-400/40';
      default:
        return 'bg-amber-700/20 text-amber-500 border-amber-700/40';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      {/* Platform Switcher Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-400">
        <div className="platform-switcher-layout max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Multi-Platform Engine:
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Shared Firebase Backend
            </span>
          </div>

          <div className="platform-switcher-nav flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onPlatformChange('web')}
              className={`platform-switcher-option flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                platformView === 'web'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe size={13} />
              <span>Web App</span>
            </button>

            <button
              onClick={() => onPlatformChange('android')}
              className={`platform-switcher-option flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                platformView === 'android'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Smartphone size={13} />
              <span>Android (Compose)</span>
            </button>

            <button
              onClick={() => onPlatformChange('ios')}
              className={`platform-switcher-option flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                platformView === 'ios'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Apple size={13} />
              <span>iOS (SwiftUI)</span>
            </button>

            <button
              onClick={() => onPlatformChange('architecture')}
              className={`platform-switcher-option flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                platformView === 'architecture'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Database size={13} />
              <span>Backend & Rules</span>
            </button>

            <button
              onClick={() => onPlatformChange('admin')}
              className={`platform-switcher-option flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                platformView === 'admin'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck size={13} />
              <span>Admin Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
              AG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">AG CREATOR</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              CREATOR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
              Your all-in-one creative workspace
            </p>
          </div>
        </div>

        {/* Tab Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
          <button
            onClick={() => { onPlatformChange('web'); onTabChange('creator'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${currentTab === 'creator' && platformView === 'web' ? 'bg-slate-800 text-white font-semibold shadow-inner' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
          >
            <WandSparkles size={16} className={currentTab === 'creator' ? 'text-emerald-400' : ''} />
            <span>Creator</span>
          </button>
          <button
            onClick={() => onTabChange('home')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              currentTab === 'home'
                ? 'bg-slate-800 text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Home size={16} className={currentTab === 'home' ? 'text-emerald-400' : ''} />
            <span>Home</span>
          </button>

          <button
            onClick={() => onTabChange('shop')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              currentTab === 'shop'
                ? 'bg-slate-800 text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShoppingBag size={16} className={currentTab === 'shop' ? 'text-emerald-400' : ''} />
            <span>Shop</span>
          </button>

          <button
            onClick={() => onTabChange('refer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              currentTab === 'refer'
                ? 'bg-slate-800 text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Share2 size={16} className={currentTab === 'refer' ? 'text-emerald-400' : ''} />
            <span>Refer & Earn</span>
          </button>

          <button
            onClick={() => onTabChange('rewards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              currentTab === 'rewards'
                ? 'bg-slate-800 text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Gift size={16} className={currentTab === 'rewards' ? 'text-emerald-400' : ''} />
            <span>Rewards</span>
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              currentTab === 'profile'
                ? 'bg-slate-800 text-white font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <UserIcon size={16} className={currentTab === 'profile' ? 'text-emerald-400' : ''} />
            <span>Profile</span>
          </button>

          {checkIsAdmin(currentUser?.email) && (
            <button
              onClick={() => {
                onPlatformChange('web');
                onTabChange('admin');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                currentTab === 'admin' && platformView === 'web'
                  ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
                  : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-slate-800/40'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* User / Auth section */}
        <div className="flex items-center gap-3">
          {currentUser && userProfile ? (
            <div className="flex items-center gap-2.5">
              {/* Points Badge */}
              <button
                onClick={() => onTabChange('rewards')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-emerald-500/30 text-white hover:border-emerald-500 transition cursor-pointer"
              >
                <Coins size={16} className="text-amber-400 shrink-0" />
                <span className="font-extrabold text-sm text-emerald-400">
                  {userProfile.pointsBalance}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  PTS
                </span>
              </button>

              {/* Tier Pill */}
              <div
                className={`hidden sm:inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg border ${getTierColor(
                  userProfile.tier
                )}`}
              >
                {userProfile.tier}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdown(!profileDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                      {(userProfile.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                </button>

                {profileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-white truncate">
                        {userProfile.displayName || 'User'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span>Code:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {userProfile.referralCode}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onTabChange('profile');
                        setProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserIcon size={14} />
                      <span>View Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        onTabChange('refer');
                        setProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Share2 size={14} />
                      <span>Refer Friends</span>
                    </button>

                    {checkIsAdmin(currentUser?.email) && (
                      <button
                        onClick={() => {
                          onPlatformChange('admin');
                          setProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-emerald-400 hover:bg-slate-800 flex items-center gap-2 font-medium"
                      >
                        <ShieldCheck size={14} />
                        <span>Admin Governance</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-slate-800" />

                    <div className="px-4 py-1.5 text-[10px] text-slate-500 flex items-center gap-1">
                      <Lock size={12} />
                      <span>Withdrawals Locked (Beta)</span>
                    </div>

                    <button
                      onClick={async () => {
                        setProfileDropdown(false);
                        await logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Sign In / Join
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar at Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => { onPlatformChange('web'); onTabChange('creator'); }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs ${currentTab === 'creator' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <WandSparkles size={18} />
          <span>Create</span>
        </button>
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs ${
            currentTab === 'home' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button
          onClick={() => onTabChange('shop')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs ${
            currentTab === 'shop' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ShoppingBag size={18} />
          <span>Shop</span>
        </button>

        <button
          onClick={() => onTabChange('refer')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs ${
            currentTab === 'refer' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Share2 size={18} />
          <span>Refer</span>
        </button>

        <button
          onClick={() => onTabChange('rewards')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs ${
            currentTab === 'rewards' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Gift size={18} />
          <span>Rewards</span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs ${
            currentTab === 'profile' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <UserIcon size={18} />
          <span>Profile</span>
        </button>
      </div>
    </header>
  );
};
