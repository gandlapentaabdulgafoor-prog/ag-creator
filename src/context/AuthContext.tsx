import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types';
import { ensureUserProfile, subscribeToUserProfile, syncUserStatsFromLedger } from '../services/referralService';
import { signOut } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  pendingReferralCode: string;
  setPendingReferralCode: (code: string) => void;
  logout: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [pendingReferralCode, setPendingReferralCode] = useState<string>('');

  // Extract referral code from URL query parameters on initial page load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref') || params.get('referral');
      if (refCode) {
        const cleaned = refCode.trim().toUpperCase();
        setPendingReferralCode(cleaned);
        sessionStorage.setItem('oneag_pending_ref', cleaned);
      } else {
        const cached = sessionStorage.getItem('oneag_pending_ref');
        if (cached) {
          setPendingReferralCode(cached);
        }
      }
    } catch {
      // safe fallback
    }
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const cachedRef = pendingReferralCode || sessionStorage.getItem('oneag_pending_ref') || null;
          await ensureUserProfile(
            user.uid,
            user.email || '',
            user.displayName,
            user.photoURL,
            cachedRef,
            'web'
          );

          // Clear stored pending ref once registered
          sessionStorage.removeItem('oneag_pending_ref');

          // Listen to real-time profile updates
          unsubscribeProfile = subscribeToUserProfile(user.uid, (profile) => {
            setUserProfile(profile);
            setLoading(false);
          });
        } catch (err) {
          console.error('Failed to sync user profile:', err);
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [pendingReferralCode]);

  const logout = async () => {
    await signOut();
    setUserProfile(null);
  };

  const refreshProfile = () => {
    if (currentUser) {
      syncUserStatsFromLedger(currentUser.uid);
      subscribeToUserProfile(currentUser.uid, (profile) => {
        setUserProfile(profile);
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        authModalOpen,
        setAuthModalOpen,
        pendingReferralCode,
        setPendingReferralCode,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
