# ONEAG Security Specification & Firestore Hardening Blueprint

## 1. Data Invariants & Production Requirements

1. **Zero Client-Side Point Minting & No Client-Controlled Reward Amounts**:
   - Clients CANNOT decide reward amounts or mutate `pointsBalance` directly.
   - Rewards and balance adjustments are calculated and verified through server-side logic and append-only ledger entries.
2. **Secure Referral Ledger Model**:
   - Every referral record contains:
     - `referrerUserId` (string, valid UID)
     - `referredUserId` (string, valid UID)
     - `referralCode` (string, 4-12 uppercase alphanumeric)
     - `platform` ("web" | "android" | "ios")
     - `status` ("PENDING" | "VERIFIED" | "REJECTED")
     - `createdAt` (ISO timestamp)
     - `verifiedAt` (ISO timestamp)
     - `rewardLedgerId` (unique ledger ID)
3. **No Self-Referral Invariant**:
   - `referrerUserId != referredUserId`. Users cannot refer themselves or inject loop referrals.
4. **No Duplicate Referrals**:
   - A referee can only be attributed once. Indexed globally at `/referrals/{referredUserId}`.
5. **No Invalid Referral Codes**:
   - Referral code must exist in `/referralCodes/{code}`.
6. **No Repeated Reward Claims**:
   - Each referral credit references a unique `rewardLedgerId`. Daily streak rewards can only be claimed once per 24 hours.
7. **Withdrawal Disabled (Beta Policy)**:
   - `withdrawalStatus` is strictly locked to `"LOCKED"`. Cannot be modified by clients.
8. **Real Firebase Authentication**:
   - Validated against real Firebase Auth UID tokens (`request.auth.uid`). No demo/fake authentication.

---

## 2. The Adversarial Test Matrix

1. **Self-Referral Attempt**: User A registers with their own referral code -> REJECT.
2. **Duplicate Referral Attempt**: User B who was already referred tries to use another code -> REJECT.
3. **Client-Controlled Reward Poisoning**: Client sends `{ amount: 99999 }` -> REJECT.
4. **Forged Referral Code**: Client registers with nonexistent code `"FAKE999"` -> REJECT.
5. **Repeated Reward Claim**: Client attempts to claim the same `rewardLedgerId` or daily bonus twice in 24 hours -> REJECT.
6. **Withdrawal Unlock Attack**: Client sends `{ withdrawalStatus: "UNLOCKED" }` -> REJECT.
7. **Identity Spoofing**: Client with `auth.uid = userA` attempts to write to `/users/userB` -> REJECT.
8. **Shadow Field Injection**: Client sends unapproved fields -> REJECT.
