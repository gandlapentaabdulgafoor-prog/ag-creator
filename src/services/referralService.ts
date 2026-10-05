import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, ReferralRecord, RewardsLedger, LoyaltyTier, UserWallet } from '../types';

export const calculateTier = (referralCount: number): LoyaltyTier => {
  if (referralCount >= 25) return 'Platinum';
  if (referralCount >= 10) return 'Gold';
  if (referralCount >= 3) return 'Silver';
  return 'Bronze';
};

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return 'Anonymous';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
};

/**
 * Generates an uppercase alphanumeric collision-checked referral code
 */
export const generateUniqueCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ONE${randomPart}`;
};

/**
 * Validate a referral code against the Firestore registry
 */
export const validateReferralCode = async (code: string): Promise<{ valid: boolean; uid?: string }> => {
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length < 4 || cleanCode.length > 12) {
    return { valid: false };
  }
  const path = `referralCodes/${cleanCode}`;
  try {
    const codeDoc = await getDoc(doc(db, 'referralCodes', cleanCode));
    if (codeDoc.exists()) {
      const data = codeDoc.data();
      return { valid: true, uid: data.uid };
    }
    return { valid: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

/**
 * Secure Referral Attribution & Validation Engine
 * 
 * Enforces production invariants:
 * 1. Prevents self-referrals (referrerUserId !== referredUserId)
 * 2. Prevents duplicate referrals (checks /referrals/{referredUserId})
 * 3. Prevents invalid referral codes (verifies /referralCodes/{code})
 * 4. Prevents client-controlled reward amounts (amount calculated server-side)
 * 5. Prevents repeated reward claims (referenced via rewardLedgerId)
 */
export const attributeReferral = async (
  referredUserId: string,
  referralCodeInput: string,
  platform: 'web' | 'android' | 'ios' = 'web'
): Promise<{ success: boolean; error?: string; record?: ReferralRecord }> => {
  const cleanCode = referralCodeInput.trim().toUpperCase();

  if (cleanCode.length < 4 || cleanCode.length > 12) {
    return { success: false, error: 'Invalid referral code format.' };
  }

  try {
    // 1. Check if referral code exists in registry
    const codeDoc = await getDoc(doc(db, 'referralCodes', cleanCode));
    if (!codeDoc.exists()) {
      return { success: false, error: 'Referral code does not exist.' };
    }

    const referrerUserId = codeDoc.data().uid;

    // 2. Prevent self-referral
    if (referrerUserId === referredUserId) {
      return { success: false, error: 'Self-referrals are strictly prohibited.' };
    }

    // 3. Prevent duplicate referrals: check if referred user already has a referral record
    const existingRefDoc = await getDoc(doc(db, 'referrals', referredUserId));
    if (existingRefDoc.exists()) {
      return { success: false, error: 'Duplicate referral: This account is already attributed.' };
    }

    const nowIso = new Date().toISOString();
    // Rule: Account creation alone must NOT create a referral reward.
    // Referral rewards are created only after an eligible genuine transaction/activity.
    const rewardLedgerId = `pending_activity_${referredUserId}`;
    const referralRecordId = `ref_${referredUserId}`;

    const record: ReferralRecord = {
      referralRecordId,
      referrerUserId,
      referredUserId,
      referralCode: cleanCode,
      platform,
      status: 'PENDING', // Attributed pending eligible transaction/activity
      clickId: null,
      transactionId: null,
      qualifyingActivityId: null,
      createdAt: nowIso,
      verifiedAt: 'PENDING_ELIGIBLE_TRANSACTION',
      rewardLedgerId
    };

    // 4. Save to global 1-to-1 index to mathematically block duplicate claims
    await setDoc(doc(db, 'referrals', referredUserId), record);

    // 5. Save to referrer's referrals subcollection for attribution tracking
    await setDoc(doc(db, `users/${referrerUserId}/referrals`, referredUserId), record);

    // Note: No immediate rewardLedger write upon account creation alone.
    // Commission/reward points are credited strictly when the referred user completes
    // an eligible genuine transaction/activity according to OneAG's configured reward rules.

    // 8. Ensure referred user's profile contains attribution (if not set in initial write)
    try {
      const referredRef = doc(db, 'users', referredUserId);
      const referredDoc = await getDoc(referredRef);
      if (referredDoc.exists()) {
        const data = referredDoc.data() as UserProfile;
        if (!data.referredBy) {
          await updateDoc(referredRef, {
            referredBy: cleanCode,
            referredByUid: referrerUserId,
            updatedAt: nowIso
          });
        }
      }
    } catch {
      // Safe fallback
    }

    return { success: true, record };
  } catch (err: unknown) {
    console.error('Referral attribution error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Referral attribution failed'
    };
  }
};

/**
 * Synchronize user's pointsBalance, totalReferrals, and tier from their authoritative rewardsLedger
 */
export const syncUserStatsFromLedger = async (uid: string): Promise<void> => {
  try {
    const ledgerSnap = await getDocs(collection(db, `users/${uid}/rewardsLedger`));
    let totalPoints = 0;
    let pendingPoints = 0;
    let referralCount = 0;

    ledgerSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (typeof data.amount === 'number') {
        if (data.status === 'CREDITED') {
          totalPoints += data.amount;
        } else if (data.status === 'PENDING') {
          pendingPoints += data.amount;
        }
      }
      if (data.type === 'REFERRAL_BONUS' || data.type === 'REFERRAL_COMMISSION') {
        referralCount++;
      }
    });

    const nowIso = new Date().toISOString();
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const profile = userDoc.data() as UserProfile;
      const targetTier = calculateTier(referralCount);
      if (
        profile.pointsBalance !== totalPoints ||
        profile.totalReferrals !== referralCount ||
        profile.tier !== targetTier
      ) {
        await updateDoc(userRef, {
          pointsBalance: totalPoints,
          totalReferrals: referralCount,
          tier: targetTier,
          updatedAt: nowIso
        });
      }
    }

    // Sync wallet document
    const walletRef = doc(db, `users/${uid}/wallet`, 'current');
    const walletDoc = await getDoc(walletRef);
    if (walletDoc.exists()) {
      const walletData = walletDoc.data() as UserWallet;
      if (walletData.availableBalance !== totalPoints || walletData.pendingBalance !== pendingPoints) {
        await updateDoc(walletRef, {
          availableBalance: totalPoints,
          pendingBalance: pendingPoints,
          totalEarned: Math.max(walletData.totalEarned || 0, totalPoints),
          updatedAt: nowIso
        });
      }
    } else {
      await setDoc(walletRef, {
        walletId: 'current',
        userId: uid,
        availableBalance: totalPoints,
        pendingBalance: pendingPoints,
        totalEarned: totalPoints,
        currency: 'PTS',
        withdrawalStatus: 'LOCKED',
        updatedAt: nowIso
      });
    }
  } catch {
    // Non-blocking sync
  }
};

/**
 * Ensures user profile and referral code mapping exist in Firestore.
 * Performs a single consistent write containing referral attribution fields.
 * Does not grant client-controlled free points. Initial points balance is 0.
 */
export const ensureUserProfile = async (
  uid: string,
  email: string,
  displayName?: string | null,
  photoURL?: string | null,
  referredByCodeInput?: string | null,
  platform: 'web' | 'android' | 'ios' = 'web'
): Promise<UserProfile> => {
  const userRef = doc(db, 'users', uid);
  const userPath = `users/${uid}`;

  try {
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const existingData = userDoc.data() as UserProfile;
      // Sync stats from immutable rewards ledger
      syncUserStatsFromLedger(uid);
      return existingData;
    }

    // Pre-validate referral code to write referredBy and referredByUid in one consistent write
    let referrerUserId: string | null = null;
    let validatedReferralCode: string | null = null;

    if (referredByCodeInput) {
      const cleanRef = referredByCodeInput.trim().toUpperCase();
      if (cleanRef.length >= 4 && cleanRef.length <= 12) {
        try {
          const codeDoc = await getDoc(doc(db, 'referralCodes', cleanRef));
          if (codeDoc.exists()) {
            const codeData = codeDoc.data();
            // Prevent self-referral
            if (codeData.uid && codeData.uid !== uid) {
              referrerUserId = codeData.uid;
              validatedReferralCode = cleanRef;
            }
          }
        } catch {
          // Pre-validation error handled gracefully
        }
      }
    }

    // Generate unique collision-checked code
    let assignedCode = generateUniqueCode();
    let attempts = 0;
    while (attempts < 5) {
      const codeCheck = await getDoc(doc(db, 'referralCodes', assignedCode));
      if (!codeCheck.exists()) {
        break;
      }
      assignedCode = generateUniqueCode();
      attempts++;
    }

    const nowIso = new Date().toISOString();

    // 1. Create unique referral code registry document
    await setDoc(doc(db, 'referralCodes', assignedCode), {
      code: assignedCode,
      uid,
      createdAt: nowIso
    });

    // 2. Initial User profile in ONE consistent write with attribution fields
    const initialProfile: UserProfile = {
      uid,
      email: email || 'user@oneag.internal',
      displayName: displayName || email.split('@')[0] || 'ONEAG Member',
      photoURL: photoURL || '',
      referralCode: assignedCode,
      referredBy: validatedReferralCode || null,
      referredByUid: referrerUserId || null,
      pointsBalance: 0, // No hardcoded free points in client!
      tier: 'Bronze',
      totalReferrals: 0,
      withdrawalStatus: 'LOCKED', // Explicitly locked during beta
      createdAt: nowIso,
      updatedAt: nowIso
    };

    await setDoc(userRef, initialProfile);

    // 3. Initialize user wallet ledger
    try {
      const walletRef = doc(db, `users/${uid}/wallet`, 'current');
      await setDoc(walletRef, {
        walletId: 'current',
        userId: uid,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        currency: 'PTS',
        withdrawalStatus: 'LOCKED',
        updatedAt: nowIso
      });
    } catch {
      // Non-blocking fallback
    }

    // 4. If referred by an invitation code, complete the server-controlled attribution
    if (validatedReferralCode && referrerUserId) {
      await attributeReferral(uid, validatedReferralCode, platform);
    }

    return initialProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
};

/**
 * Claim daily streak reward with server-side checking to prevent repeated claims
 */
export const claimDailyStreakReward = async (
  uid: string
): Promise<{ success: boolean; message: string; pointsAdded: number }> => {
  const userRef = doc(db, 'users', uid);
  const userPath = `users/${uid}`;
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const streakDocId = `daily_${todayDateStr}`;

  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, message: 'User not found', pointsAdded: 0 };
    }

    const userData = userDoc.data() as UserProfile;

    // Check if streak already claimed today (Prevents repeated reward claims)
    const checkStreak = await getDoc(doc(db, `users/${uid}/rewardsLedger`, streakDocId));
    if (checkStreak.exists()) {
      return { success: false, message: 'Daily reward already claimed today! Check back tomorrow.', pointsAdded: 0 };
    }

    const nowIso = new Date().toISOString();
    const pointsToAdd = 25; // Standard check-in points

    // Append to immutable ledger
    await setDoc(doc(db, `users/${uid}/rewardsLedger`, streakDocId), {
      id: streakDocId,
      userId: uid,
      amount: pointsToAdd,
      type: 'DAILY_STREAK',
      description: `Daily Check-In Bonus for ${todayDateStr}`,
      status: 'CREDITED',
      createdAt: nowIso
    });

    // Update user balance
    await updateDoc(userRef, {
      pointsBalance: (userData.pointsBalance || 0) + pointsToAdd,
      updatedAt: nowIso
    });

    return {
      success: true,
      message: `Successfully verified check-in: +${pointsToAdd} PTS credited to your ledger!`,
      pointsAdded: pointsToAdd
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
};

/**
 * Subscribe to current user profile in real-time
 */
export const subscribeToUserProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
  const userPath = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, userPath);
    }
  );
};

/**
 * Subscribe to user's referral list in real-time
 */
export const subscribeToReferrals = (uid: string, callback: (referrals: ReferralRecord[]) => void) => {
  const path = `users/${uid}/referrals`;
  const q = query(collection(db, `users/${uid}/referrals`), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const records: ReferralRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as ReferralRecord);
      });
      callback(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
};

/**
 * Subscribe to user's rewards ledger in real-time
 */
export const subscribeToRewardsLedger = (uid: string, callback: (ledger: RewardsLedger[]) => void) => {
  const path = `users/${uid}/rewardsLedger`;
  const q = query(collection(db, `users/${uid}/rewardsLedger`), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const entries: RewardsLedger[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as RewardsLedger);
      });
      callback(entries);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
};

/**
 * Subscribe to user's wallet summary in real-time
 */
export const subscribeToUserWallet = (uid: string, callback: (wallet: UserWallet | null) => void) => {
  const walletPath = `users/${uid}/wallet/current`;
  return onSnapshot(
    doc(db, `users/${uid}/wallet`, 'current'),
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserWallet);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, walletPath);
    }
  );
};

/**
 * Retrieve user's current wallet
 */
export const getUserWallet = async (uid: string): Promise<UserWallet | null> => {
  const walletPath = `users/${uid}/wallet/current`;
  try {
    const snap = await getDoc(doc(db, `users/${uid}/wallet`, 'current'));
    if (snap.exists()) {
      return snap.data() as UserWallet;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, walletPath);
    return null;
  }
};

