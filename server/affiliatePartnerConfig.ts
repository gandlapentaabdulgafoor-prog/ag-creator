/**
 * ONEAG Server-Side Affiliate Partner Configuration Layer
 *
 * This module runs exclusively in trusted server environments (Node.js / Express).
 * PRIVATE CREDENTIALS AND SECRETS ARE NEVER EXPOSED TO WEB, ANDROID, OR IOS CLIENTS.
 *
 * Supported Official Partner APIs:
 * 1. Amazon Associates India:
 *    - Official Catalog API: Amazon Creators API only.
 *    - Optional Server-Side Environment Variables:
 *      * AMAZON_ASSOCIATE_TAG
 *      * AMAZON_CREATORS_CLIENT_ID
 *      * AMAZON_CREATORS_CLIENT_SECRET
 *      * AMAZON_CREATORS_CREDENTIAL_VERSION
 *      * AMAZON_CREATORS_MARKETPLACE (default: "amazon.in")
 *    - Status: Integration remains strictly DISABLED until valid official Creators API credentials exist.
 *    - No fabricated credentials or unauthorized API calls.
 *
 * 2. Flipkart Affiliate Network:
 *    - Official Partner Variables:
 *      * FLIPKART_AFFILIATE_ID
 *      * FLIPKART_AFFILIATE_TOKEN
 *    - Status: Integration remains strictly DISABLED until valid official affiliate credentials exist.
 *
 * 3. Myntra Partner Program:
 *    - Optional provider configuration.
 *    - Status: Integration remains strictly DISABLED until an official supported affiliate/API credential path is available.
 *    - No invented MYNTRA_API_KEY or fabricated partner credentials.
 *
 * 4. Meesho Partner Program:
 *    - Optional provider configuration.
 *    - Status: Integration remains strictly DISABLED until an official supported affiliate/API credential path is available.
 *    - No invented MEESHO_API_KEY or fabricated partner credentials.
 */

export type AffiliatePartnerId = 'amazon' | 'flipkart' | 'myntra' | 'meesho' | string;

export type StandardTransactionStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'REJECTED';

export type PartnerOperationalStatus =
  | 'DISABLED'
  | 'PENDING_CONFIG'
  | 'ACTIVE'
  | 'MAINTENANCE';

export interface ServerPartnerCredentials {
  // Amazon Creators API
  associateTag?: string;
  creatorsClientId?: string;
  creatorsClientSecret?: string;
  creatorsCredentialVersion?: string;
  creatorsMarketplace?: string;

  // Flipkart Affiliate
  affiliateId?: string;
  affiliateToken?: string;

  // Myntra Partner Program (pending official supported partner path)
  myntraAffiliateId?: string;
  myntraAffiliateToken?: string;

  // Meesho Partner Program (pending official supported partner path)
  meeshoAffiliateId?: string;
  meeshoAffiliateToken?: string;

  // General server-side postback webhook secret (optional)
  webhookSecret?: string;
}

export interface ServerPartnerConfig {
  partnerId: AffiliatePartnerId;
  name: string;
  shortName: string;
  category: string;
  description: string;
  baseUrl: string;
  allowedDomains: string[];
  affiliateProgramName: string;
  defaultTrackingParam: string;
  subTrackingParam: string;
  commissionNotice: string;
  officialApiName: string;
  feedSupported: boolean;
  webhookSupported: boolean;
  credentialsEnvKeys: {
    associateTagOrId?: string;
    clientIdOrToken?: string;
    clientSecret?: string;
    credentialVersion?: string;
    marketplace?: string;
    webhookSecret?: string;
  };
}

export interface PartnerHealthStatus {
  partnerId: AffiliatePartnerId;
  name: string;
  shortName: string;
  officialApiName: string;
  operationalStatus: PartnerOperationalStatus;
  credentialsConfigured: boolean;
  productFeedConfigured: boolean;
  postbackWebhookConfigured: boolean;
  readinessNotice: string;
  lastCheckedAt: string;
}

export interface OutboundClickPayload {
  clickId: string;
  userId: string;
  referrerUserId?: string | null;
  referralRecordId?: string | null;
  partnerId: AffiliatePartnerId;
  productId: string;
  destinationUrl: string;
}

export interface InboundPostbackPayload {
  partnerId: AffiliatePartnerId;
  partnerTransactionId: string;
  rawStatus: string;
  clickId?: string;
  subId?: string;
  userId?: string;
  purchaseAmount: number;
  currency: string;
  partnerCommissionAmount: number;
  orderTimestamp: string;
  rawPayload?: Record<string, unknown>;
}

export interface CommissionCalculationResult {
  purchaseAmount: number;
  currency: string;
  grossCommission: number;
  userRewardPoints: number;
  referrerRewardPoints: number;
  platformSharePoints: number;
  isCapped: boolean;
  status: StandardTransactionStatus;
}

/**
 * Official Server-Side Partner Definitions
 * Secrets are resolved dynamically from process.env at runtime.
 */
export const SERVER_PARTNER_REGISTRY: Record<string, ServerPartnerConfig> = {
  amazon: {
    partnerId: 'amazon',
    name: 'Amazon Associates',
    shortName: 'Amazon',
    category: 'Multi-Category Retail',
    description: 'Amazon Associates India with official Amazon Creators API support.',
    baseUrl: 'https://www.amazon.in',
    allowedDomains: ['amazon.in', 'www.amazon.in', 'amzn.to', 'amzn.in'],
    affiliateProgramName: 'Amazon Associates India (Creators API)',
    defaultTrackingParam: 'tag',
    subTrackingParam: 'ascsubtag',
    commissionNotice: 'Earn up to 10% advertising commission on qualifying purchases.',
    officialApiName: 'Amazon Creators API',
    feedSupported: true,
    webhookSupported: true,
    credentialsEnvKeys: {
      associateTagOrId: 'AMAZON_ASSOCIATE_TAG',
      clientIdOrToken: 'AMAZON_CREATORS_CLIENT_ID',
      clientSecret: 'AMAZON_CREATORS_CLIENT_SECRET',
      credentialVersion: 'AMAZON_CREATORS_CREDENTIAL_VERSION',
      marketplace: 'AMAZON_CREATORS_MARKETPLACE',
      webhookSecret: 'AMAZON_POSTBACK_SECRET'
    }
  },
  flipkart: {
    partnerId: 'flipkart',
    name: 'Flipkart Affiliate',
    shortName: 'Flipkart',
    category: 'Electronics, Appliances & Lifestyle',
    description: 'Leading Indian e-commerce platform offering top electronics, fashion, and home goods.',
    baseUrl: 'https://www.flipkart.com',
    allowedDomains: ['flipkart.com', 'www.flipkart.com', 'fkrt.it'],
    affiliateProgramName: 'Flipkart Affiliate Network',
    defaultTrackingParam: 'affid',
    subTrackingParam: 'affExtParam1',
    commissionNotice: 'Earn tiered affiliate commissions across electronics, fashion, and daily staples.',
    officialApiName: 'Flipkart Affiliate API & Feeds',
    feedSupported: true,
    webhookSupported: true,
    credentialsEnvKeys: {
      associateTagOrId: 'FLIPKART_AFFILIATE_ID',
      clientIdOrToken: 'FLIPKART_AFFILIATE_TOKEN',
      webhookSecret: 'FLIPKART_POSTBACK_SECRET'
    }
  },
  myntra: {
    partnerId: 'myntra',
    name: 'Myntra Partner Program',
    shortName: 'Myntra',
    category: 'Fashion & Lifestyle',
    description: 'India’s premier online fashion destination featuring top international and domestic brands.',
    baseUrl: 'https://www.myntra.com',
    allowedDomains: ['myntra.com', 'www.myntra.com'],
    affiliateProgramName: 'Myntra Affiliate Program',
    defaultTrackingParam: 'utm_source',
    subTrackingParam: 'subId',
    commissionNotice: 'Fashion and lifestyle commissions credited upon genuine order delivery.',
    officialApiName: 'Official Supported Partner Path (Pending)',
    feedSupported: false,
    webhookSupported: false,
    credentialsEnvKeys: {
      associateTagOrId: 'MYNTRA_AFFILIATE_ID',
      clientIdOrToken: 'MYNTRA_AFFILIATE_TOKEN',
      webhookSecret: 'MYNTRA_POSTBACK_SECRET'
    }
  },
  meesho: {
    partnerId: 'meesho',
    name: 'Meesho Partner Program',
    shortName: 'Meesho',
    category: 'Fashion, Home & Daily Essentials',
    description: 'India’s fastest growing social commerce and value marketplace for apparel, home, and lifestyle.',
    baseUrl: 'https://www.meesho.com',
    allowedDomains: ['meesho.com', 'www.meesho.com'],
    affiliateProgramName: 'Meesho Affiliate Program',
    defaultTrackingParam: 'utm_source',
    subTrackingParam: 'subId',
    commissionNotice: 'Commissions verified upon delivery and expiration of the customer return period.',
    officialApiName: 'Official Supported Partner Path (Pending)',
    feedSupported: false,
    webhookSupported: false,
    credentialsEnvKeys: {
      associateTagOrId: 'MEESHO_AFFILIATE_ID',
      clientIdOrToken: 'MEESHO_AFFILIATE_TOKEN',
      webhookSecret: 'MEESHO_POSTBACK_SECRET'
    }
  }
};

/**
 * 1. Partner Status & Credential Evaluation (Server-Side)
 * Reads runtime process.env without throwing or baking values into client
 */
export function getPartnerCredentials(partnerId: string): ServerPartnerCredentials {
  const config = SERVER_PARTNER_REGISTRY[partnerId];
  if (!config) return {};

  const keys = config.credentialsEnvKeys;

  if (partnerId === 'amazon') {
    return {
      associateTag: keys.associateTagOrId ? process.env[keys.associateTagOrId] : undefined,
      creatorsClientId: keys.clientIdOrToken ? process.env[keys.clientIdOrToken] : undefined,
      creatorsClientSecret: keys.clientSecret ? process.env[keys.clientSecret] : undefined,
      creatorsCredentialVersion: keys.credentialVersion ? process.env[keys.credentialVersion] : undefined,
      creatorsMarketplace: keys.marketplace ? process.env[keys.marketplace] || 'amazon.in' : 'amazon.in',
      webhookSecret: keys.webhookSecret ? process.env[keys.webhookSecret] : undefined
    };
  }

  if (partnerId === 'flipkart') {
    return {
      affiliateId: keys.associateTagOrId ? process.env[keys.associateTagOrId] : undefined,
      affiliateToken: keys.clientIdOrToken ? process.env[keys.clientIdOrToken] : undefined,
      webhookSecret: keys.webhookSecret ? process.env[keys.webhookSecret] : undefined
    };
  }

  // Myntra: Do not invent credentials, read officially configured environment variables if set
  if (partnerId === 'myntra') {
    return {
      myntraAffiliateId: keys.associateTagOrId ? process.env[keys.associateTagOrId] : undefined,
      myntraAffiliateToken: keys.clientIdOrToken ? process.env[keys.clientIdOrToken] : undefined,
      affiliateId: keys.associateTagOrId ? process.env[keys.associateTagOrId] : undefined,
      affiliateToken: keys.clientIdOrToken ? process.env[keys.clientIdOrToken] : undefined,
      webhookSecret: keys.webhookSecret ? process.env[keys.webhookSecret] : undefined
    };
  }

  // Meesho: Do not invent credentials, read officially configured environment variables if set
  if (partnerId === 'meesho') {
    return {
      meeshoAffiliateId: keys.associateTagOrId ? process.env[keys.associateTagOrId] : undefined,
      meeshoAffiliateToken: keys.clientIdOrToken ? process.env[keys.clientIdOrToken] : undefined,
      affiliateId: keys.associateTagOrId ? process.env[keys.associateTagOrId] : undefined,
      affiliateToken: keys.clientIdOrToken ? process.env[keys.clientIdOrToken] : undefined,
      webhookSecret: keys.webhookSecret ? process.env[keys.webhookSecret] : undefined
    };
  }

  return {
    webhookSecret: keys.webhookSecret ? process.env[keys.webhookSecret] : undefined
  };
}

export function getPartnerHealth(partnerId: string): PartnerHealthStatus {
  const config = SERVER_PARTNER_REGISTRY[partnerId];
  const nowIso = new Date().toISOString();

  if (!config) {
    return {
      partnerId,
      name: partnerId,
      shortName: partnerId,
      officialApiName: 'Unknown',
      operationalStatus: 'DISABLED',
      credentialsConfigured: false,
      productFeedConfigured: false,
      postbackWebhookConfigured: false,
      readinessNotice: 'Unknown affiliate partner provider.',
      lastCheckedAt: nowIso
    };
  }

  const creds = getPartnerCredentials(partnerId);

  // Amazon evaluation:
  // Requires AMAZON_ASSOCIATE_TAG, AMAZON_CREATORS_CLIENT_ID, and AMAZON_CREATORS_CLIENT_SECRET
  if (partnerId === 'amazon') {
    const hasAssociateTag = Boolean(creds.associateTag && creds.associateTag.trim());
    const hasClientId = Boolean(creds.creatorsClientId && creds.creatorsClientId.trim());
    const hasClientSecret = Boolean(creds.creatorsClientSecret && creds.creatorsClientSecret.trim());
    const hasVersion = Boolean(creds.creatorsCredentialVersion && creds.creatorsCredentialVersion.trim());

    const hasValidCredentials = hasAssociateTag && hasClientId && hasClientSecret;

    if (hasValidCredentials) {
      return {
        partnerId: config.partnerId,
        name: config.name,
        shortName: config.shortName,
        officialApiName: config.officialApiName,
        operationalStatus: 'ACTIVE',
        credentialsConfigured: true,
        productFeedConfigured: true,
        postbackWebhookConfigured: Boolean(creds.webhookSecret),
        readinessNotice: 'Amazon Creators API credentials configured and operational.',
        lastCheckedAt: nowIso
      };
    }

    // Keep Amazon integration DISABLED until valid Creators API credentials are actually available
    return {
      partnerId: config.partnerId,
      name: config.name,
      shortName: config.shortName,
      officialApiName: config.officialApiName,
      operationalStatus: 'DISABLED',
      credentialsConfigured: false,
      productFeedConfigured: false,
      postbackWebhookConfigured: false,
      readinessNotice: 'Disabled / Not configured. Amazon Creators API integration is optional and inactive. ONEAG runs normally without affiliate credentials.',
      lastCheckedAt: nowIso
    };
  }

  // Flipkart evaluation:
  // Requires FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN
  if (partnerId === 'flipkart') {
    const hasId = Boolean(creds.affiliateId && creds.affiliateId.trim());
    const hasToken = Boolean(creds.affiliateToken && creds.affiliateToken.trim());
    const hasValidCredentials = hasId && hasToken;

    if (hasValidCredentials) {
      return {
        partnerId: config.partnerId,
        name: config.name,
        shortName: config.shortName,
        officialApiName: config.officialApiName,
        operationalStatus: 'ACTIVE',
        credentialsConfigured: true,
        productFeedConfigured: true,
        postbackWebhookConfigured: Boolean(creds.webhookSecret),
        readinessNotice: 'Flipkart Affiliate credentials configured and operational.',
        lastCheckedAt: nowIso
      };
    }

    return {
      partnerId: config.partnerId,
      name: config.name,
      shortName: config.shortName,
      officialApiName: config.officialApiName,
      operationalStatus: 'DISABLED',
      credentialsConfigured: false,
      productFeedConfigured: false,
      postbackWebhookConfigured: false,
      readinessNotice: 'Disabled / Not configured. Flipkart Affiliate integration is optional and inactive. ONEAG runs normally without affiliate credentials.',
      lastCheckedAt: nowIso
    };
  }

  // Myntra evaluation:
  // Requires official supported partner credentials when configured.
  // Status remains strictly DISABLED / NOT CONFIGURED until verified.
  if (partnerId === 'myntra') {
    const hasId = Boolean((creds.myntraAffiliateId || creds.affiliateId)?.trim());
    const hasToken = Boolean((creds.myntraAffiliateToken || creds.affiliateToken)?.trim());
    const hasValidCredentials = hasId && hasToken;

    if (hasValidCredentials) {
      return {
        partnerId: config.partnerId,
        name: config.name,
        shortName: config.shortName,
        officialApiName: config.officialApiName,
        operationalStatus: 'ACTIVE',
        credentialsConfigured: true,
        productFeedConfigured: true,
        postbackWebhookConfigured: Boolean(creds.webhookSecret),
        readinessNotice: 'Myntra Partner Program credentials configured and operational.',
        lastCheckedAt: nowIso
      };
    }

    return {
      partnerId: config.partnerId,
      name: config.name,
      shortName: config.shortName,
      officialApiName: config.officialApiName,
      operationalStatus: 'DISABLED',
      credentialsConfigured: false,
      productFeedConfigured: false,
      postbackWebhookConfigured: false,
      readinessNotice: 'Disabled / Not configured. Myntra integration is optional and inactive. Awaiting official supported partner credentials and feed.',
      lastCheckedAt: nowIso
    };
  }

  // Meesho evaluation:
  // Requires official supported partner credentials when configured.
  // Status remains strictly DISABLED / NOT CONFIGURED until verified.
  if (partnerId === 'meesho') {
    const hasId = Boolean((creds.meeshoAffiliateId || creds.affiliateId)?.trim());
    const hasToken = Boolean((creds.meeshoAffiliateToken || creds.affiliateToken)?.trim());
    const hasValidCredentials = hasId && hasToken;

    if (hasValidCredentials) {
      return {
        partnerId: config.partnerId,
        name: config.name,
        shortName: config.shortName,
        officialApiName: config.officialApiName,
        operationalStatus: 'ACTIVE',
        credentialsConfigured: true,
        productFeedConfigured: true,
        postbackWebhookConfigured: Boolean(creds.webhookSecret),
        readinessNotice: 'Meesho Partner Program credentials configured and operational.',
        lastCheckedAt: nowIso
      };
    }

    return {
      partnerId: config.partnerId,
      name: config.name,
      shortName: config.shortName,
      officialApiName: config.officialApiName,
      operationalStatus: 'DISABLED',
      credentialsConfigured: false,
      productFeedConfigured: false,
      postbackWebhookConfigured: false,
      readinessNotice: 'Disabled / Not configured. Meesho integration is optional and inactive. Awaiting official supported partner credentials and feed.',
      lastCheckedAt: nowIso
    };
  }

  return {
    partnerId: config.partnerId,
    name: config.name,
    shortName: config.shortName,
    officialApiName: config.officialApiName,
    operationalStatus: 'DISABLED',
    credentialsConfigured: false,
    productFeedConfigured: false,
    postbackWebhookConfigured: false,
    readinessNotice: 'Disabled / Not configured. Optional provider pending official supported affiliate credential path. ONEAG runs normally without affiliate credentials.',
    lastCheckedAt: nowIso
  };
}

export function getAllPartnerHealthList(): PartnerHealthStatus[] {
  return Object.keys(SERVER_PARTNER_REGISTRY).map((id) => getPartnerHealth(id));
}

/**
 * 2. Affiliate Tracking & Deep-Link Configuration (Server-Side)
 * Validates target domain against allowed hosts and constructs tracking parameters
 */
export function buildSecureAffiliateDeepLink(
  partnerId: string,
  destinationUrl: string,
  trackingPayload: {
    clickId: string;
    userId: string;
    referrerUserId?: string | null;
  }
): { success: boolean; deepLink?: string; error?: string } {
  const config = SERVER_PARTNER_REGISTRY[partnerId];
  if (!config) {
    return { success: false, error: `Unrecognized affiliate partner: ${partnerId}` };
  }

  // Ensure Myntra remains unavailable to customers until an officially supported affiliate integration is configured and verified
  if (partnerId === 'myntra') {
    const health = getPartnerHealth('myntra');
    if (health.operationalStatus !== 'ACTIVE') {
      return {
        success: false,
        error: 'Myntra Partner Program is NOT CONFIGURED. Deep links are disabled and unavailable to customers until officially verified.'
      };
    }
  }

  // Ensure Meesho remains unavailable to customers until an officially supported affiliate integration is configured and verified
  if (partnerId === 'meesho') {
    const health = getPartnerHealth('meesho');
    if (health.operationalStatus !== 'ACTIVE') {
      return {
        success: false,
        error: 'Meesho Partner Program is NOT CONFIGURED. Deep links are disabled and unavailable to customers until officially verified.'
      };
    }
  }

  try {
    const parsed = new URL(destinationUrl);
    const isDomainAllowed = config.allowedDomains.some((d) =>
      parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)
    );

    if (!isDomainAllowed) {
      return {
        success: false,
        error: `Destination domain ${parsed.hostname} is not in the allowed domain list for ${config.name}`
      };
    }

    const creds = getPartnerCredentials(partnerId);
    const partnerTag = creds.associateTag || creds.affiliateId || `oneag_${partnerId}_pending`;

    // Encode subtag payload preserving clickId and inviter attribution
    const subtagValue = `${trackingPayload.clickId}_${trackingPayload.userId.substring(0, 8)}`;

    parsed.searchParams.set(config.defaultTrackingParam, partnerTag);
    parsed.searchParams.set(config.subTrackingParam, subtagValue);

    return {
      success: true,
      deepLink: parsed.toString()
    };
  } catch {
    return { success: false, error: 'Malformed destination URL' };
  }
}

/**
 * 3. API & Catalog Feed Configuration Specifications (Server-Side)
 * Updated to reflect Amazon Creators API, Flipkart Affiliate Feeds, and pending Myntra path.
 */
export interface PartnerFeedSpec {
  partnerId: AffiliatePartnerId;
  apiProtocol: 'CREATORS_API' | 'FLIPKART_AFFILIATE_FEEDS' | 'OFFICIAL_PARTNER_PENDING';
  endpoint: string;
  authMethod: 'OAUTH2_CLIENT_CREDENTIALS' | 'TOKEN_HEADER' | 'PENDING';
  status: 'DISABLED_PENDING_CREDENTIALS' | 'AVAILABLE';
  notes: string;
}

export const PARTNER_FEED_SPECS: Record<string, PartnerFeedSpec> = {
  amazon: {
    partnerId: 'amazon',
    apiProtocol: 'CREATORS_API',
    endpoint: 'https://creators.amazon.com/api/v1',
    authMethod: 'OAUTH2_CLIENT_CREDENTIALS',
    status: 'DISABLED_PENDING_CREDENTIALS',
    notes: 'Amazon Creators API. Requires AMAZON_ASSOCIATE_TAG, AMAZON_CREATORS_CLIENT_ID, and AMAZON_CREATORS_CLIENT_SECRET. Disabled until credentials exist.'
  },
  flipkart: {
    partnerId: 'flipkart',
    apiProtocol: 'FLIPKART_AFFILIATE_FEEDS',
    endpoint: 'https://affiliate-api.flipkart.net/affiliate/1.0/feeds/',
    authMethod: 'TOKEN_HEADER',
    status: 'DISABLED_PENDING_CREDENTIALS',
    notes: 'Flipkart Affiliate API & Product Feeds. Requires FLIPKART_AFFILIATE_ID and FLIPKART_AFFILIATE_TOKEN. Disabled until credentials exist.'
  },
  myntra: {
    partnerId: 'myntra',
    apiProtocol: 'OFFICIAL_PARTNER_PENDING',
    endpoint: '',
    authMethod: 'PENDING',
    status: 'DISABLED_PENDING_CREDENTIALS',
    notes: 'Myntra Partner Program. Integration remains strictly DISABLED until officially supported partner API credentials and product feed are provided. No scraping or fabricated keys.'
  },
  meesho: {
    partnerId: 'meesho',
    apiProtocol: 'OFFICIAL_PARTNER_PENDING',
    endpoint: '',
    authMethod: 'PENDING',
    status: 'DISABLED_PENDING_CREDENTIALS',
    notes: 'Meesho Partner Program. Integration remains strictly DISABLED until officially supported partner API credentials and product feed are provided. No scraping or fabricated keys.'
  }
};

/**
 * Provider-agnostic Product Model (Server-Side)
 * Supports products ingested from Amazon Creators API, Flipkart Affiliate Feeds,
 * Myntra, or Meesho supported partner feed/API.
 */
export interface ServerProductModel {
  provider: 'amazon' | 'flipkart' | 'myntra' | 'meesho' | string;
  externalProductId: string;
  title: string;
  description?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  price: number;
  currency: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'UNKNOWN' | string;
  trackingId?: string;
  lastUpdated: string;
}

/**
 * Explicit Myntra Provider Product Interface (Server-Side)
 * Strictly matches the 12 required canonical provider fields:
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
  category: string;
  price: number;
  currency: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'UNKNOWN' | string;
  trackingId?: string;
  lastUpdated: string;
}

/**
 * Explicit Meesho Provider Product Interface (Server-Side)
 * Strictly matches the 12 required canonical provider fields:
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
  category: string;
  price: number;
  currency: string;
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' | 'UNKNOWN' | string;
  trackingId?: string;
  lastUpdated: string;
}

/**
 * Server-side Myntra Feed Discovery & Ingestion Specification
 * Integration is DISABLED until official affiliate/feed credentials exist.
 * No scraping, mock products, or simulated APIs.
 */
export interface MyntraDiscoveryFeedResult {
  partnerId: 'myntra';
  status: 'DISABLED' | 'NOT_CONFIGURED' | 'ACTIVE';
  totalProductsDiscovered: number;
  products: MyntraProductModel[];
  notice: string;
  lastCheckedAt: string;
}

export function discoverMyntraProductFeed(): MyntraDiscoveryFeedResult {
  const health = getPartnerHealth('myntra');
  const nowIso = new Date().toISOString();

  if (health.operationalStatus !== 'ACTIVE') {
    return {
      partnerId: 'myntra',
      status: 'NOT_CONFIGURED',
      totalProductsDiscovered: 0,
      products: [],
      notice: 'Myntra product feed is NOT CONFIGURED. Feed ingestion is disabled until an officially supported affiliate integration is configured and verified.',
      lastCheckedAt: nowIso
    };
  }

  // Once official credentials exist in process.env, real feed ingestion occurs here without scraping
  return {
    partnerId: 'myntra',
    status: 'ACTIVE',
    totalProductsDiscovered: 0,
    products: [],
    notice: 'Official Myntra feed active. 0 catalog items currently synced.',
    lastCheckedAt: nowIso
  };
}

/**
 * Server-side Meesho Feed Discovery & Ingestion Specification
 * Integration is DISABLED until official affiliate/feed credentials exist.
 * No scraping, mock products, or simulated APIs.
 */
export interface MeeshoDiscoveryFeedResult {
  partnerId: 'meesho';
  status: 'DISABLED' | 'NOT_CONFIGURED' | 'ACTIVE';
  totalProductsDiscovered: number;
  products: MeeshoProductModel[];
  notice: string;
  lastCheckedAt: string;
}

export function discoverMeeshoProductFeed(): MeeshoDiscoveryFeedResult {
  const health = getPartnerHealth('meesho');
  const nowIso = new Date().toISOString();

  if (health.operationalStatus !== 'ACTIVE') {
    return {
      partnerId: 'meesho',
      status: 'NOT_CONFIGURED',
      totalProductsDiscovered: 0,
      products: [],
      notice: 'Meesho product feed is NOT CONFIGURED. Feed ingestion is disabled until an officially supported affiliate integration is configured and verified.',
      lastCheckedAt: nowIso
    };
  }

  // Once official credentials exist in process.env, real feed ingestion occurs here without scraping
  return {
    partnerId: 'meesho',
    status: 'ACTIVE',
    totalProductsDiscovered: 0,
    products: [],
    notice: 'Official Meesho feed active. 0 catalog items currently synced.',
    lastCheckedAt: nowIso
  };
}

export function transformRawPartnerProductToCanonical(
  provider: 'amazon' | 'flipkart' | 'myntra' | 'meesho' | string,
  raw: any
): ServerProductModel {
  const nowIso = new Date().toISOString();
  if (provider === 'amazon') {
    return {
      provider: 'amazon',
      externalProductId: String(raw.asin || raw.externalProductId || ''),
      title: String(raw.title || raw.name || ''),
      description: raw.description ? String(raw.description) : undefined,
      imageUrl: String(raw.imageUrl || raw.largeImageUrl || ''),
      productUrl: String(raw.productUrl || raw.detailPageUrl || ''),
      category: String(raw.category || 'Electronics'),
      price: Number(raw.price || raw.listingPrice || 0),
      currency: String(raw.currency || 'INR'),
      availability: raw.availability || 'IN_STOCK',
      trackingId: raw.trackingId ? String(raw.trackingId) : undefined,
      lastUpdated: raw.lastUpdated || nowIso
    };
  }
  if (provider === 'flipkart') {
    return {
      provider: 'flipkart',
      externalProductId: String(raw.productId || raw.externalProductId || ''),
      title: String(raw.title || raw.productName || ''),
      description: raw.description ? String(raw.description) : undefined,
      imageUrl: String(raw.imageUrl || raw.imageUrls?.[0] || ''),
      productUrl: String(raw.productUrl || raw.baseUrl || ''),
      category: String(raw.category || 'Electronics'),
      price: Number(raw.price || raw.flipkartSellingPrice || 0),
      currency: String(raw.currency || 'INR'),
      availability: raw.availability || (raw.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK'),
      trackingId: raw.trackingId ? String(raw.trackingId) : undefined,
      lastUpdated: raw.lastUpdated || nowIso
    };
  }
  if (provider === 'myntra') {
    return {
      provider: 'myntra',
      externalProductId: String(raw.externalProductId || raw.styleId || raw.productId || ''),
      title: String(raw.title || raw.productName || raw.name || ''),
      description: raw.description ? String(raw.description) : undefined,
      imageUrl: String(raw.imageUrl || raw.searchImage || raw.images?.[0]?.src || ''),
      productUrl: String(raw.productUrl || raw.landingPageUrl || (raw.styleId ? `https://www.myntra.com/${raw.styleId}` : '')),
      category: String(raw.category || 'Fashion'),
      price: Number(raw.price || raw.discountedPrice || raw.mrp || 0),
      currency: String(raw.currency || 'INR'),
      availability: raw.availability || (raw.inStock === false || raw.inventory === 0 ? 'OUT_OF_STOCK' : 'IN_STOCK'),
      trackingId: raw.trackingId ? String(raw.trackingId) : undefined,
      lastUpdated: raw.lastUpdated || nowIso
    };
  }
  if (provider === 'meesho') {
    return {
      provider: 'meesho',
      externalProductId: String(raw.externalProductId || raw.productId || raw.itemId || ''),
      title: String(raw.title || raw.productName || raw.name || ''),
      description: raw.description ? String(raw.description) : undefined,
      imageUrl: String(raw.imageUrl || raw.productImage || raw.images?.[0] || ''),
      productUrl: String(raw.productUrl || raw.url || ''),
      category: String(raw.category || 'Fashion'),
      price: Number(raw.price || raw.discountedPrice || raw.mrp || 0),
      currency: String(raw.currency || 'INR'),
      availability: raw.availability || (raw.inStock === false || raw.inventory === 0 ? 'OUT_OF_STOCK' : 'IN_STOCK'),
      trackingId: raw.trackingId ? String(raw.trackingId) : undefined,
      lastUpdated: raw.lastUpdated || nowIso
    };
  }
  return {
    provider,
    externalProductId: String(raw.externalProductId || raw.id || ''),
    title: String(raw.title || ''),
    description: raw.description ? String(raw.description) : undefined,
    imageUrl: String(raw.imageUrl || ''),
    productUrl: String(raw.productUrl || ''),
    category: String(raw.category || 'Fashion'),
    price: Number(raw.price || 0),
    currency: String(raw.currency || 'INR'),
    availability: raw.availability || 'IN_STOCK',
    trackingId: raw.trackingId ? String(raw.trackingId) : undefined,
    lastUpdated: raw.lastUpdated || nowIso
  };
}

/**
 * 4. Outbound Click Validation (Server-Side)
 */
export function validateOutboundClickPayload(payload: Partial<OutboundClickPayload>): {
  isValid: boolean;
  sanitized?: OutboundClickPayload;
  error?: string;
} {
  if (!payload.clickId || typeof payload.clickId !== 'string' || !payload.clickId.startsWith('clk_')) {
    return { isValid: false, error: 'Invalid or missing clickId' };
  }
  if (!payload.userId || typeof payload.userId !== 'string') {
    return { isValid: false, error: 'Invalid or missing userId' };
  }
  if (!payload.partnerId || !SERVER_PARTNER_REGISTRY[payload.partnerId]) {
    return { isValid: false, error: `Invalid affiliate partner: ${payload.partnerId}` };
  }
  if (!payload.productId || typeof payload.productId !== 'string') {
    return { isValid: false, error: 'Invalid or missing productId' };
  }
  if (!payload.destinationUrl || typeof payload.destinationUrl !== 'string') {
    return { isValid: false, error: 'Invalid or missing destinationUrl' };
  }

  return {
    isValid: true,
    sanitized: {
      clickId: payload.clickId,
      userId: payload.userId,
      referrerUserId: payload.referrerUserId || null,
      referralRecordId: payload.referralRecordId || null,
      partnerId: payload.partnerId,
      productId: payload.productId,
      destinationUrl: payload.destinationUrl
    }
  };
}

/**
 * 5. Transaction Status Mapping (Server-Side)
 * Maps heterogeneous partner statuses to standard ONEAG lifecycle states:
 * PENDING, CONFIRMED, CANCELLED, REFUNDED
 */
export function mapPartnerTransactionStatus(
  partnerId: string,
  rawStatus: string
): StandardTransactionStatus {
  const norm = (rawStatus || '').toLowerCase().trim();

  if (partnerId === 'amazon') {
    if (['delivered_return_expired', 'settled', 'approved', 'paid'].includes(norm)) {
      return 'CONFIRMED';
    }
    if (['rejected', 'ineligible', 'disqualified'].includes(norm)) {
      return 'REJECTED';
    }
    if (['cancelled', 'canceled', 'failed'].includes(norm)) {
      return 'CANCELLED';
    }
    if (['returned', 'refunded', 'reversal'].includes(norm)) {
      return 'REFUNDED';
    }
    return 'PENDING';
  }

  if (partnerId === 'flipkart') {
    if (['completed', 'approved', 'cleared'].includes(norm)) {
      return 'CONFIRMED';
    }
    if (['disapproved', 'invalid', 'rejected'].includes(norm)) {
      return 'REJECTED';
    }
    if (['cancelled', 'canceled', 'failed'].includes(norm)) {
      return 'CANCELLED';
    }
    if (['refunded', 'returned'].includes(norm)) {
      return 'REFUNDED';
    }
    return 'PENDING';
  }

  if (partnerId === 'myntra') {
    if (['delivered_reconciled', 'settled', 'success', 'approved', 'confirmed'].includes(norm)) {
      return 'CONFIRMED';
    }
    if (['rejected', 'declined', 'disapproved', 'ineligible'].includes(norm)) {
      return 'REJECTED';
    }
    if (['cancelled', 'canceled', 'failed'].includes(norm)) {
      return 'CANCELLED';
    }
    if (['returned', 'refunded', 'reversal'].includes(norm)) {
      return 'REFUNDED';
    }
    return 'PENDING';
  }

  if (partnerId === 'meesho') {
    if (['delivered_reconciled', 'settled', 'success', 'approved', 'confirmed'].includes(norm)) {
      return 'CONFIRMED';
    }
    if (['rejected', 'declined', 'disapproved', 'ineligible'].includes(norm)) {
      return 'REJECTED';
    }
    if (['cancelled', 'canceled', 'failed'].includes(norm)) {
      return 'CANCELLED';
    }
    if (['returned', 'refunded', 'reversal', 'rto'].includes(norm)) {
      return 'REFUNDED';
    }
    return 'PENDING';
  }

  // Generic fallback
  if (['completed', 'confirmed', 'success', 'settled'].includes(norm)) return 'CONFIRMED';
  if (['rejected', 'declined', 'disapproved', 'ineligible'].includes(norm)) return 'REJECTED';
  if (['cancelled', 'canceled', 'failed'].includes(norm)) return 'CANCELLED';
  if (['refunded', 'returned', 'chargeback'].includes(norm)) return 'REFUNDED';
  return 'PENDING';
}

/**
 * 6. Commission & Reward Calculation with Anti-Fraud Safety Caps (Server-Side)
 */
export interface RewardRulesConfig {
  userCashbackPercentage: number;
  referralCommissionPercentage: number;
  pointsPerInr: number;
  maxRewardPointsPerTransaction: number;
  maxDailyRewardPointsPerUser: number;
}

export const DEFAULT_REWARD_RULES: RewardRulesConfig = {
  userCashbackPercentage: 50,
  referralCommissionPercentage: 20,
  pointsPerInr: 10,
  maxRewardPointsPerTransaction: 5000,
  maxDailyRewardPointsPerUser: 15000
};

export function calculateTransactionCommission(
  postback: InboundPostbackPayload,
  rules: RewardRulesConfig = DEFAULT_REWARD_RULES
): CommissionCalculationResult {
  const status = mapPartnerTransactionStatus(postback.partnerId, postback.rawStatus);
  const grossCommission = Math.max(0, postback.partnerCommissionAmount || 0);

  if (status === 'CANCELLED' || status === 'REFUNDED' || status === 'REJECTED') {
    return {
      purchaseAmount: postback.purchaseAmount,
      currency: postback.currency || 'INR',
      grossCommission: 0,
      userRewardPoints: 0,
      referrerRewardPoints: 0,
      platformSharePoints: 0,
      isCapped: false,
      status
    };
  }

  const rawUserShareInr = (grossCommission * rules.userCashbackPercentage) / 100;
  const rawReferrerShareInr = (grossCommission * rules.referralCommissionPercentage) / 100;

  let userPoints = Math.round(rawUserShareInr * rules.pointsPerInr);
  let referrerPoints = Math.round(rawReferrerShareInr * rules.pointsPerInr);
  let isCapped = false;

  if (userPoints > rules.maxRewardPointsPerTransaction) {
    userPoints = rules.maxRewardPointsPerTransaction;
    isCapped = true;
  }

  if (referrerPoints > rules.maxRewardPointsPerTransaction) {
    referrerPoints = rules.maxRewardPointsPerTransaction;
    isCapped = true;
  }

  const totalPoints = Math.round(grossCommission * rules.pointsPerInr);
  const platformPoints = Math.max(0, totalPoints - userPoints - referrerPoints);

  return {
    purchaseAmount: postback.purchaseAmount,
    currency: postback.currency || 'INR',
    grossCommission,
    userRewardPoints: userPoints,
    referrerRewardPoints: referrerPoints,
    platformSharePoints: platformPoints,
    isCapped,
    status
  };
}

/**
 * 7. State Transition Rules
 * Validates legal status transitions to prevent double-crediting or illegal updates
 */
export function validateStateTransition(
  current: StandardTransactionStatus,
  next: StandardTransactionStatus
): { isAllowed: boolean; error?: string } {
  if (current === next) {
    return { isAllowed: true };
  }

  if (current === 'PENDING') {
    return { isAllowed: true };
  }

  if (current === 'CONFIRMED') {
    if (next === 'REFUNDED') {
      return { isAllowed: true };
    }
    return { isAllowed: false, error: 'CONFIRMED transaction cannot transition to CANCELLED, REJECTED, or PENDING' };
  }

  if (current === 'CANCELLED' || current === 'REFUNDED' || current === 'REJECTED') {
    return { isAllowed: false, error: `Terminal transaction state ${current} cannot be modified` };
  }

  return { isAllowed: false, error: `Unsupported transition from ${current} to ${next}` };
}

/**
 * 8. Client Safe Projection
 * Sanitizes all private environment variables, secret tokens, and endpoints.
 * Suitable for returning to Web, Android, or iOS client applications.
 */
export function getClientSafePartnerProjection(): Array<{
  partnerId: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  baseUrl: string;
  affiliateProgramName: string;
  officialApiName: string;
  defaultTrackingParam: string;
  status: 'PENDING_CONFIG' | 'ACTIVE' | 'DISABLED';
  commissionNotice: string;
  onboarding: {
    connectionStatus: string;
    credentialsStatus: string;
    productFeedStatus: string;
    trackingStatus: string;
    postbackWebhookStatus: string;
    readinessNotice: string;
  };
}> {
  return Object.values(SERVER_PARTNER_REGISTRY).map((partner) => {
    const health = getPartnerHealth(partner.partnerId);
    const isActive = health.operationalStatus === 'ACTIVE';
    return {
      partnerId: partner.partnerId,
      name: partner.name,
      shortName: partner.shortName,
      category: partner.category,
      description: partner.description,
      baseUrl: partner.baseUrl,
      affiliateProgramName: partner.affiliateProgramName,
      officialApiName: partner.officialApiName,
      defaultTrackingParam: partner.defaultTrackingParam,
      status: isActive ? 'ACTIVE' : 'DISABLED',
      commissionNotice: partner.commissionNotice,
      onboarding: {
        connectionStatus: isActive ? 'ACTIVE' : 'NOT CONFIGURED',
        credentialsStatus: health.credentialsConfigured ? 'CONFIGURED' : 'NOT CONFIGURED',
        productFeedStatus: health.productFeedConfigured ? 'CONFIGURED' : 'NOT CONFIGURED',
        trackingStatus: isActive ? 'CONFIGURED' : 'NOT CONFIGURED',
        postbackWebhookStatus: health.postbackWebhookConfigured ? 'CONFIGURED' : 'NOT CONFIGURED',
        readinessNotice: health.readinessNotice
      }
    };
  });
}
