export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type WithdrawalStatus = 'LOCKED' | 'PENDING_EARLY_ACCESS' | 'DISABLED';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  referralCode: string;
  referredBy?: string | null;
  referredByUid?: string | null;
  pointsBalance: number;
  tier: LoyaltyTier;
  totalReferrals: number;
  withdrawalStatus: WithdrawalStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Wallet model supporting cleared balance, pending holds, and locked withdrawal status
 */
export interface UserWallet {
  walletId: string;
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  currency: string;
  withdrawalStatus: WithdrawalStatus;
  lastTransactionAt?: string;
  updatedAt: string;
}

export interface ReferralCodeMapping {
  code: string;
  uid: string;
  createdAt: string;
}

/**
 * Secure Referral Attribution & Ledger Model
 * Separates referrerUserId, referredUserId, referralRecordId, clickId, and transactionId
 */
export interface ReferralRecord {
  referralRecordId?: string;
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  platform: 'web' | 'android' | 'ios';
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  clickId?: string | null;
  transactionId?: string | null;
  qualifyingActivityId?: string | null;
  createdAt: string;
  verifiedAt: string;
  rewardLedgerId: string;
}

export type RewardEventType =
  | 'PURCHASE_REWARD'
  | 'REFERRAL_COMMISSION'
  | 'DAILY_STREAK'
  | 'COMMUNITY_TASK'
  | 'TIER_UPGRADE'
  | 'REVERSAL_REFUND'
  | 'SIGNUP_WELCOME' // Deprecated/disabled from referral earnings
  | 'REFERRAL_BONUS'; // Legacy alias maintained for ledger read compatibility

export interface RewardsLedger {
  id: string;
  userId: string;
  amount: number;
  type: RewardEventType;
  description: string;
  referenceId?: string;
  status: 'CREDITED' | 'PENDING' | 'REVERSED';
  createdAt: string;
}

export interface AppPolicy {
  joiningFee: number;
  investmentRequired: boolean;
  withdrawalEnabled: boolean;
  withdrawalNotice: string;
  guaranteedIncomeDisclaimer: string;
}

export interface RewardConfiguration {
  configId: string;
  partnerCommissionDependency: string;
  rewardCalculationMethod: string;
  userRewardShareRate: number;
  referralCommissionShareRate: number;
  maxRewardCapPerTransaction: number;
  maxMonthlyRewardCap: number;
  pendingConfirmationPeriodDays: number;
  refundCancellationPolicy: string;
  minEligiblePurchaseAmount: number;
  updatedAt: string;
}

export interface MonthlyActivityTracking {
  monthYear: string;
  userId: string;
  eligiblePurchaseCount: number;
  eligiblePurchaseVolume: number;
  earnedPointsPending: number;
  earnedPointsConfirmed: number;
  rewardTier: LoyaltyTier;
  tierThresholdMet: string;
  updatedAt: string;
}

export type TabType = 'creator' | 'home' | 'shop' | 'refer' | 'rewards' | 'profile' | 'admin';
export type PlatformView = 'web' | 'android' | 'ios' | 'architecture' | 'admin';

/**
 * 10 Canonical Shopping Categories
 */
export type ShopCategory =
  | 'Electronics'
  | 'Mobile Accessories'
  | 'Fashion'
  | 'Home & Kitchen'
  | 'Beauty & Personal Care'
  | 'Grocery / Household'
  | 'Furniture'
  | 'Appliances'
  | 'Daily-use Products'
  | 'Deals / Offers'
  | 'Daily Use'
  | 'Deals & Offers';

/**
 * Provider-agnostic Affiliate Partner identifiers
 */
export type AffiliatePartnerId = 'amazon' | 'flipkart' | 'myntra' | 'meesho' | string;

export interface AffiliatePartnerOnboarding {
  connectionStatus: string;
  credentialsStatus: string;
  productFeedStatus: string;
  trackingStatus?: string;
  postbackWebhookStatus: string;
  readinessNotice: string;
}

/**
 * Provider-agnostic Affiliate Partner model
 */
export interface AffiliatePartner {
  partnerId: AffiliatePartnerId;
  name: string;
  shortName: string;
  category: string;
  description: string;
  logoUrl?: string;
  badgeText?: string;
  baseUrl: string;
  affiliateProgramName: string;
  officialApiName?: string;
  defaultTrackingParam: string;
  isConfigured: boolean;
  status: 'PENDING_CONFIG' | 'ACTIVE' | 'MAINTENANCE' | 'DISABLED';
  commissionNotice: string;
  onboarding?: AffiliatePartnerOnboarding;
}

/**
 * Affiliate Partner Configuration stored in Firestore
 * Does not contain private API secrets
 */
export interface AffiliatePartnerConfig {
  partnerId: string;
  partnerName: string;
  programName: string;
  baseDomain: string;
  trackingParameter: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_CONFIG' | 'MAINTENANCE';
  deepLinkTemplate: string;
  postbackMetadata: string;
  category: string;
  commissionNotice: string;
  updatedAt: string;
}

/**
 * Canonical Myntra Provider Product Interface
 * Prepared for official Myntra affiliate/partner mechanisms.
 * Exact 12 canonical fields:
 * - provider
 * - externalProductId
 * - title
 * - description
 * - imageUrl
 * - productUrl
 * - category
 * - price
 * - currency
 * - availability
 * - trackingId
 * - lastUpdated
 */
export interface MyntraProductModel {
  provider: 'myntra';
  externalProductId: string;
  title: string;
  description?: string;
  imageUrl: string;
  productUrl: string;
  category: ShopCategory | string;
  price: number;
  currency: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'UNKNOWN' | string;
  trackingId?: string;
  lastUpdated: string;
}

/**
 * Canonical Meesho Provider Product Interface
 * Prepared for official Meesho affiliate/partner mechanisms.
 * Exact 12 canonical fields:
 * - provider
 * - externalProductId
 * - title
 * - description
 * - imageUrl
 * - productUrl
 * - category
 * - price
 * - currency
 * - availability
 * - trackingId
 * - lastUpdated
 */
export interface MeeshoProductModel {
  provider: 'meesho';
  externalProductId: string;
  title: string;
  description?: string;
  imageUrl: string;
  productUrl: string;
  category: ShopCategory | string;
  price: number;
  currency: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'UNKNOWN' | string;
  trackingId?: string;
  lastUpdated: string;
}

/**
 * Provider-agnostic Product model supporting Amazon Creators API,
 * Flipkart Affiliate API/Feeds, Myntra, and Meesho supported partner feed/API.
 */
export interface Product {
  productId: string;
  provider: 'amazon' | 'flipkart' | 'myntra' | 'meesho' | string;
  partnerId?: AffiliatePartnerId;
  externalProductId: string;
  title: string;
  description?: string;
  imageUrl: string;
  productUrl: string;
  deepLink?: string;
  category: ShopCategory;
  price: number;
  currency: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'UNKNOWN' | string;
  trackingId?: string;
  trackingInfo?: {
    campaign?: string;
    subTag?: string;
    customTag?: string;
  };
  lastUpdated: string;
}

/**
 * Affiliate Click Tracking record
 */
export interface AffiliateClick {
  clickId: string;
  userId: string;
  referralId: string | null;
  referrerUserId?: string | null;
  referralRecordId?: string | null;
  partnerId: AffiliatePartnerId;
  productId: string;
  trackingId: string;
  timestamp: string;
  productTitle?: string;
  targetUrl?: string;
}

/**
 * Affiliate Transaction states and tracking model
 * Supports standard lifecycle states: PENDING, CONFIRMED, CANCELLED, REFUNDED, REJECTED
 */
export type TransactionStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'REJECTED';
export type RefundStatus = 'NONE' | 'INITIATED' | 'COMPLETED' | 'REJECTED';

export interface AffiliateTransaction {
  transactionId: string;
  userId: string;
  referredUserId?: string;
  referrerUserId?: string | null;
  referralId?: string | null;
  referralRecordId?: string | null;
  partnerId: AffiliatePartnerId;
  productId: string;
  clickId: string;
  trackingId?: string;
  purchaseAmount: number;
  commissionAmount: number;
  rewardAmount: number;
  transactionStatus: TransactionStatus;
  refundStatus: RefundStatus;
  confirmationDate?: string;
  createdAt: string;
  updatedAt: string;
}
