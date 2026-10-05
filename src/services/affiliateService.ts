import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  ShopCategory,
  AffiliatePartner,
  Product,
  AffiliateClick,
  AffiliateTransaction,
  RewardConfiguration,
  AffiliatePartnerConfig
} from '../types';

/**
 * 10 Canonical Shopping Categories required by OneAG
 */
export const SHOP_CATEGORIES: { id: ShopCategory; name: string; description: string; icon: string }[] = [
  { id: 'Electronics', name: 'Electronics', description: 'Smartphones, Audio, Laptops & Gadgets', icon: 'Cpu' },
  { id: 'Mobile Accessories', name: 'Mobile Accessories', description: 'Cases, Chargers, Power Banks & Cables', icon: 'Smartphone' },
  { id: 'Fashion', name: 'Fashion', description: 'Men, Women & Kids Apparel and Footwear', icon: 'Shirt' },
  { id: 'Home & Kitchen', name: 'Home & Kitchen', description: 'Cookware, Home Decor & Storage', icon: 'Home' },
  { id: 'Beauty & Personal Care', name: 'Beauty & Personal Care', description: 'Skincare, Grooming & Fragrances', icon: 'Sparkles' },
  { id: 'Grocery / Household', name: 'Grocery / Household', description: 'Pantry Essentials & Daily Staples', icon: 'ShoppingBag' },
  { id: 'Furniture', name: 'Furniture', description: 'Workstations, Living & Bedroom Furniture', icon: 'Armchair' },
  { id: 'Appliances', name: 'Appliances', description: 'Refrigerators, Air Conditioners & Microwaves', icon: 'Tv' },
  { id: 'Daily-use Products', name: 'Daily-use Products', description: 'Cleaning, Utilities & Daily Consumables', icon: 'Layers' },
  { id: 'Deals / Offers', name: 'Deals / Offers', description: 'Curated Limited-Time Partner Deals', icon: 'Tag' }
];

/**
 * Provider-agnostic Affiliate Partner Registry
 * No credentials or secret keys are hard-coded.
 * Official partner programs provide API keys or affiliate IDs via backend environment.
 */
export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    partnerId: 'amazon',
    name: 'Amazon Associates',
    shortName: 'Amazon',
    category: 'Multi-Category Retail',
    description: 'World’s largest marketplace with millions of eligible retail products across all categories.',
    baseUrl: 'https://www.amazon.in',
    affiliateProgramName: 'Amazon Associates India (Creators API)',
    officialApiName: 'Amazon Creators API',
    defaultTrackingParam: 'tag',
    isConfigured: false,
    status: 'DISABLED',
    commissionNotice: 'Earn up to 10% advertising commission on qualifying purchases.',
    onboarding: {
      connectionStatus: 'Disabled / Not configured',
      credentialsStatus: 'Credentials not configured (Optional)',
      productFeedStatus: 'Product feed not configured',
      postbackWebhookStatus: 'Postback/webhook not configured',
      readinessNotice: 'Integration disabled. Awaiting official Amazon Creators API credentials.'
    }
  },
  {
    partnerId: 'flipkart',
    name: 'Flipkart Affiliate',
    shortName: 'Flipkart',
    category: 'Electronics, Appliances & Lifestyle',
    description: 'Leading Indian e-commerce platform offering top electronics, fashion, and home goods.',
    baseUrl: 'https://www.flipkart.com',
    affiliateProgramName: 'Flipkart Affiliate Network',
    officialApiName: 'Flipkart Affiliate API & Feeds',
    defaultTrackingParam: 'affid',
    isConfigured: false,
    status: 'DISABLED',
    commissionNotice: 'Earn tiered affiliate commissions across electronics, fashion, and daily staples.',
    onboarding: {
      connectionStatus: 'Disabled / Not configured',
      credentialsStatus: 'Credentials not configured (Optional)',
      productFeedStatus: 'Product feed not configured',
      postbackWebhookStatus: 'Postback/webhook not configured',
      readinessNotice: 'Integration disabled. Awaiting official Flipkart Affiliate credentials.'
    }
  },
  {
    partnerId: 'myntra',
    name: 'Myntra Partner Program',
    shortName: 'Myntra',
    category: 'Fashion & Lifestyle',
    description: 'India’s premier online fashion destination featuring top international and domestic brands.',
    baseUrl: 'https://www.myntra.com',
    affiliateProgramName: 'Myntra Affiliate Program',
    officialApiName: 'Official Supported Partner Path (Pending)',
    defaultTrackingParam: 'utm_source',
    isConfigured: false,
    status: 'DISABLED',
    commissionNotice: 'Fashion and lifestyle commissions credited upon genuine order delivery.',
    onboarding: {
      connectionStatus: 'NOT CONFIGURED',
      credentialsStatus: 'NOT CONFIGURED',
      productFeedStatus: 'NOT CONFIGURED',
      trackingStatus: 'NOT CONFIGURED',
      postbackWebhookStatus: 'NOT CONFIGURED',
      readinessNotice: 'Myntra Partner Program is NOT CONFIGURED. Unavailable to customers until an officially supported affiliate integration is configured and verified.'
    }
  },
  {
    partnerId: 'meesho',
    name: 'Meesho Partner Program',
    shortName: 'Meesho',
    category: 'Fashion, Home & Daily Essentials',
    description: 'India’s fastest growing social commerce and value marketplace for apparel, home, and lifestyle.',
    baseUrl: 'https://www.meesho.com',
    affiliateProgramName: 'Meesho Affiliate Program',
    officialApiName: 'Official Supported Partner Path (Pending)',
    defaultTrackingParam: 'utm_source',
    isConfigured: false,
    status: 'DISABLED',
    commissionNotice: 'Commissions verified upon delivery and expiration of the customer return period.',
    onboarding: {
      connectionStatus: 'NOT CONFIGURED',
      credentialsStatus: 'NOT CONFIGURED',
      productFeedStatus: 'NOT CONFIGURED',
      trackingStatus: 'NOT CONFIGURED',
      postbackWebhookStatus: 'NOT CONFIGURED',
      readinessNotice: 'Meesho Partner Program is NOT CONFIGURED. Unavailable to customers until an officially supported affiliate integration is configured and verified.'
    }
  }
];

/**
 * Generates an approved affiliate deep link with transparent sub-tracking
 */
export const generateAffiliateDeepLink = (
  product: Product,
  trackingId: string,
  userId?: string
): string => {
  try {
    const rawUrl = product.productUrl || 'https://www.amazon.in';
    const url = new URL(rawUrl);
    const provider = product.provider || product.partnerId || 'amazon';

    // Provider-specific parameter tagging
    switch (provider) {
      case 'amazon':
        url.searchParams.set('tag', 'oneag-affiliate-21'); // Fallback tag
        url.searchParams.set('ascsubtag', `${trackingId}${userId ? `_${userId}` : ''}`);
        break;
      case 'flipkart':
        url.searchParams.set('affid', 'oneag_partner');
        url.searchParams.set('affExtParam1', trackingId);
        if (userId) url.searchParams.set('affExtParam2', userId);
        break;
      case 'myntra':
        // Myntra remains strictly disabled / unavailable until officially configured and verified
        return product.productUrl || 'https://www.myntra.com';
      case 'meesho':
        // Meesho remains strictly disabled / unavailable until officially configured and verified
        return product.productUrl || 'https://www.meesho.com';
      default:
        url.searchParams.set('ref_oneag', trackingId);
        break;
    }

    return url.toString();
  } catch {
    // If URL parsing fails, return clean original URL
    return product.productUrl;
  }
};

/**
 * Retrieves dynamic partner operational status from the secure server-side configuration layer.
 * Falls back to static canonical registry if the server endpoint is unreachable.
 */
export const getAffiliatePartnersWithServerStatus = async (): Promise<AffiliatePartner[]> => {
  try {
    const res = await fetch('/api/affiliate/partners');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.partners) && data.partners.length > 0) {
        return data.partners as AffiliatePartner[];
      }
    }
  } catch {
    // Network or offline fallback
  }
  return AFFILIATE_PARTNERS;
};

/**
 * Record an affiliate click in Firestore before navigating to external partner.
 * Generates the deep link server-side when live partner credentials are available,
 * and creates an auditable outbound click record.
 * Captures: userId, referrerUserId, referralRecordId, partnerId, productId, clickId, trackingId, and timestamp
 */
export const recordAffiliateClick = async (
  userId: string,
  referrerUserId: string | null,
  product: Product,
  referralRecordId?: string | null
): Promise<{ click: AffiliateClick; deepLink: string }> => {
  const nowIso = new Date().toISOString();
  const clickId = `clk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const trackingId = `trk_${Date.now().toString(36)}_${clickId.slice(-4)}`;
  const provider = product.provider || product.partnerId || 'amazon';

  // Request server-side authoritative deep link generation
  let deepLink = product.productUrl;
  try {
    const res = await fetch('/api/affiliate/generate-deep-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId: provider,
        destinationUrl: product.productUrl,
        clickId,
        userId,
        referrerUserId: referrerUserId || undefined
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.deepLink) {
        deepLink = data.deepLink;
      } else {
        deepLink = generateAffiliateDeepLink(product, trackingId, userId);
      }
    } else {
      deepLink = generateAffiliateDeepLink(product, trackingId, userId);
    }
  } catch {
    // Fallback to client generator if offline or dev
    deepLink = generateAffiliateDeepLink(product, trackingId, userId);
  }

  const clickRecord: AffiliateClick = {
    clickId,
    userId,
    referralId: referrerUserId || null,
    referrerUserId: referrerUserId || null,
    referralRecordId: referralRecordId || (referrerUserId ? `ref_${userId}` : null),
    partnerId: provider,
    productId: product.productId || product.externalProductId || 'unknown',
    trackingId,
    timestamp: nowIso,
    productTitle: product.title,
    targetUrl: deepLink
  };

  const path = `affiliateClicks/${clickId}`;
  try {
    await setDoc(doc(db, 'affiliateClicks', clickId), clickRecord);
  } catch (error) {
    // Even if tracking write fails, handle Firestore error and do not block user navigation
    console.warn('Click record logging notice:', error);
  }

  return { click: clickRecord, deepLink };
};

/**
 * Retrieve genuine products from Firestore catalog
 * Does NOT return mock or fake products.
 * If external feed is not yet synced, returns empty array.
 */
export const getProducts = async (
  categoryFilter?: ShopCategory | 'ALL',
  limitCount: number = 20
): Promise<Product[]> => {
  const path = 'products';
  try {
    const productsRef = collection(db, 'products');
    let q = query(productsRef, limit(limitCount));

    if (categoryFilter && categoryFilter !== 'ALL') {
      q = query(productsRef, where('category', '==', categoryFilter), limit(limitCount));
    }

    const snapshot = await getDocs(q);
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      products.push(docSnap.data() as Product);
    });

    return products;
  } catch (error) {
    // Return empty array if collection does not exist or rules deny unauthenticated read
    console.warn('Products catalog notice: No active external feed catalog loaded yet.');
    return [];
  }
};

/**
 * Retrieve genuine user affiliate transactions from Firestore
 * Returns only genuine transactions verified by server/webhook.
 */
export const getUserAffiliateTransactions = async (
  userId: string
): Promise<AffiliateTransaction[]> => {
  const path = 'affiliateTransactions';
  try {
    const txRef = collection(db, 'affiliateTransactions');
    const q = query(txRef, where('userId', '==', userId), limit(20));
    const snapshot = await getDocs(q);
    const transactions: AffiliateTransaction[] = [];
    snapshot.forEach((docSnap) => {
      transactions.push(docSnap.data() as AffiliateTransaction);
    });
    return transactions;
  } catch (error) {
    return [];
  }
};

/**
 * Retrieve user's logged clicks for transparency
 */
export const getUserAffiliateClicks = async (
  userId: string,
  limitCount: number = 10
): Promise<AffiliateClick[]> => {
  try {
    const clicksRef = collection(db, 'affiliateClicks');
    const q = query(clicksRef, where('userId', '==', userId), limit(limitCount));
    const snapshot = await getDocs(q);
    const clicks: AffiliateClick[] = [];
    snapshot.forEach((docSnap) => {
      clicks.push(docSnap.data() as AffiliateClick);
    });
    // Sort descending by timestamp in client
    return clicks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    return [];
  }
};

/**
 * Retrieve dynamic purchase reward and commission distribution rules
 * Does NOT hard-code final rates or guaranteed user earnings.
 */
export const getRewardConfiguration = async (): Promise<RewardConfiguration> => {
  const fallbackConfig: RewardConfiguration = {
    configId: 'default_v1',
    partnerCommissionDependency: 'VARIABLE_PERCENTAGE_OF_PARTNER_COMMISSION',
    rewardCalculationMethod: 'DYNAMIC_FORMULA_BASED',
    userRewardShareRate: 0.50, // 50% of realized advertising commission allocated to shopper
    referralCommissionShareRate: 0.20, // 20% of realized advertising commission allocated to eligible referrer
    maxRewardCapPerTransaction: 500, // Safety cap per single transaction
    maxMonthlyRewardCap: 2500, // Configurable monthly cap
    pendingConfirmationPeriodDays: 45, // Aligned with partner return/exchange policy window
    refundCancellationPolicy: 'AUTOMATIC_REVERSAL_ON_PARTNER_RETURN',
    minEligiblePurchaseAmount: 100,
    updatedAt: new Date().toISOString()
  };

  try {
    const configSnap = await getDoc(doc(db, 'appConfig', 'rewardRules'));
    if (configSnap.exists()) {
      return configSnap.data() as RewardConfiguration;
    }
  } catch {
    // Return fallback dynamic structure
  }
  return fallbackConfig;
};

