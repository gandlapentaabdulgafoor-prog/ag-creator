import { Router, Request, Response } from 'express';
import {
  SERVER_PARTNER_REGISTRY,
  getPartnerHealth,
  getAllPartnerHealthList,
  getClientSafePartnerProjection,
  buildSecureAffiliateDeepLink,
  validateOutboundClickPayload,
  mapPartnerTransactionStatus,
  calculateTransactionCommission,
  validateStateTransition,
  getPartnerCredentials,
  PARTNER_FEED_SPECS,
  InboundPostbackPayload,
  StandardTransactionStatus,
  discoverMyntraProductFeed,
  discoverMeeshoProductFeed
} from './affiliatePartnerConfig.js';
import { ledgerWorkerService } from './ledgerWorker.js';

export const affiliateServerRouter = Router();

/**
 * GET /api/affiliate/partners
 * Returns public, sanitized partner status for Web, Android, and iOS clients.
 * Private API keys and tokens are NEVER exposed.
 */
affiliateServerRouter.get('/partners', (_req: Request, res: Response) => {
  try {
    const safeProjection = getClientSafePartnerProjection();
    res.json({
      success: true,
      partners: safeProjection,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve partner statuses',
      message: error?.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/affiliate/partner/:partnerId/status
 * Detailed health & onboarding check for a specific partner provider
 */
affiliateServerRouter.get('/partner/:partnerId/status', (req: Request, res: Response) => {
  const { partnerId } = req.params;
  const config = SERVER_PARTNER_REGISTRY[partnerId];

  if (!config) {
    res.status(404).json({
      success: false,
      error: `Affiliate partner '${partnerId}' not recognized`
    });
    return;
  }

  const health = getPartnerHealth(partnerId);
  res.json({
    success: true,
    health
  });
});

/**
 * GET /api/affiliate/feed-specs
 * Returns provider-agnostic feed specifications for Amazon Creators API, Flipkart, and Myntra
 */
affiliateServerRouter.get('/feed-specs', (_req: Request, res: Response) => {
  res.json({
    success: true,
    specs: PARTNER_FEED_SPECS
  });
});

/**
 * GET /api/affiliate/partner/:partnerId/feed
 * Discovers and returns partner product feed.
 * For Myntra, returns safe NOT_CONFIGURED empty feed state with notice.
 */
affiliateServerRouter.get('/partner/:partnerId/feed', (req: Request, res: Response) => {
  const { partnerId } = req.params;
  if (partnerId === 'myntra') {
    const feed = discoverMyntraProductFeed();
    res.json({
      success: true,
      feed
    });
    return;
  }

  if (partnerId === 'meesho') {
    const feed = discoverMeeshoProductFeed();
    res.json({
      success: true,
      feed
    });
    return;
  }

  res.json({
    success: true,
    feed: {
      partnerId,
      status: 'NOT_CONFIGURED',
      totalProductsDiscovered: 0,
      products: [],
      notice: `Product feed for ${partnerId} is not configured.`
    }
  });
});

/**
 * POST /api/affiliate/generate-deep-link
 * Securely generates an outbound deep link with sanitized domain and sub-tag attribution
 */
affiliateServerRouter.post('/generate-deep-link', (req: Request, res: Response) => {
  const { partnerId, destinationUrl, clickId, userId, referrerUserId } = req.body;

  if (!partnerId || !destinationUrl || !clickId || !userId) {
    res.status(400).json({
      success: false,
      error: 'Missing required parameters: partnerId, destinationUrl, clickId, userId'
    });
    return;
  }

  const result = buildSecureAffiliateDeepLink(partnerId, destinationUrl, {
    clickId,
    userId,
    referrerUserId
  });

  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
});

/**
 * POST /api/affiliate/validate-click
 * Validates click payload and structure before persisting
 */
affiliateServerRouter.post('/validate-click', (req: Request, res: Response) => {
  const validation = validateOutboundClickPayload(req.body);

  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      error: validation.error
    });
    return;
  }

  res.json({
    success: true,
    click: validation.sanitized
  });
});

/**
 * POST /api/affiliate/postback/:partnerId
 * Secure Webhook / Postback ingestion endpoint for official partner networks
 * Restricts access via server webhook secret, maps status, applies safety caps.
 * NOTE: Clients (Web, iOS, Android) CANNOT write or alter transactions directly.
 */
affiliateServerRouter.post('/postback/:partnerId', async (req: Request, res: Response) => {
  const { partnerId } = req.params;
  const config = SERVER_PARTNER_REGISTRY[partnerId];

  if (!config) {
    res.status(404).json({
      success: false,
      error: `Unknown partner '${partnerId}'`
    });
    return;
  }

  // Authenticate webhook request if partner secret is configured on the server
  const authCheck = ledgerWorkerService.verifyPostbackAuth(partnerId, req.headers, JSON.stringify(req.body));
  if (!authCheck.isValid) {
    res.status(401).json({
      success: false,
      error: authCheck.reason || 'Unauthorized webhook invocation: invalid secret or signature'
    });
    return;
  }

  const body = req.body || {};
  const partnerTransactionId = body.partnerTransactionId || body.orderId || body.txId || `tx_${Date.now()}`;
  const rawStatus = body.status || body.rawStatus || 'pending';
  const purchaseAmount = Number(body.purchaseAmount || body.orderAmount || 0);
  const currency = body.currency || 'INR';
  const commissionAmount = Number(body.commissionAmount || body.payout || 0);
  const customIdempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || body.idempotencyKey) as string | undefined;

  const result = await ledgerWorkerService.processPostback({
    partnerId,
    externalTransactionId: String(partnerTransactionId),
    rawStatus: String(rawStatus),
    clickId: body.clickId || body.subId || body.affExtParam1 || body.ascsubtag,
    userId: body.userId,
    referrerUserId: body.referrerUserId,
    purchaseAmount,
    commissionAmount,
    currency,
    idempotencyKey: customIdempotencyKey,
    rawPayload: body
  }, {
    authHeaderVerified: true,
    ipAddress: req.ip
  });

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error || 'Failed to process postback event',
      eventId: result.eventId,
      idempotencyKey: result.idempotencyKey,
      mappedStatus: result.mappedStatus
    });
    return;
  }

  res.json({
    success: true,
    isDuplicate: result.isDuplicate,
    reconciliation: {
      partnerId,
      partnerTransactionId: String(partnerTransactionId),
      mappedStatus: result.mappedStatus,
      purchaseAmount,
      grossCommission: commissionAmount,
      userRewardPoints: result.userRewardPoints,
      referrerRewardPoints: result.referrerRewardPoints,
      walletState: result.walletState,
      eventId: result.eventId,
      idempotencyKey: result.idempotencyKey,
      note: result.message || 'Transaction reconciled via authoritative server-side postback worker.'
    }
  });
});

/**
 * POST /api/affiliate/postback
 * Generic webhook endpoint supporting provider identifier in body or query
 */
affiliateServerRouter.post('/postback', async (req: Request, res: Response) => {
  const partnerId = (req.body?.partnerId || req.query?.partnerId || '').toString().toLowerCase();
  if (!partnerId || !SERVER_PARTNER_REGISTRY[partnerId]) {
    res.status(400).json({
      success: false,
      error: `Missing or invalid partnerId parameter: '${partnerId}'`
    });
    return;
  }

  const authCheck = ledgerWorkerService.verifyPostbackAuth(partnerId, req.headers, JSON.stringify(req.body));
  if (!authCheck.isValid) {
    res.status(401).json({
      success: false,
      error: authCheck.reason || 'Unauthorized webhook invocation'
    });
    return;
  }

  const body = req.body || {};
  const partnerTransactionId = body.partnerTransactionId || body.orderId || body.txId || `tx_${Date.now()}`;
  const rawStatus = body.status || body.rawStatus || 'pending';
  const purchaseAmount = Number(body.purchaseAmount || body.orderAmount || 0);
  const currency = body.currency || 'INR';
  const commissionAmount = Number(body.commissionAmount || body.payout || 0);
  const customIdempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || body.idempotencyKey) as string | undefined;

  const result = await ledgerWorkerService.processPostback({
    partnerId,
    externalTransactionId: String(partnerTransactionId),
    rawStatus: String(rawStatus),
    clickId: body.clickId || body.subId || body.affExtParam1 || body.ascsubtag,
    userId: body.userId,
    referrerUserId: body.referrerUserId,
    purchaseAmount,
    commissionAmount,
    currency,
    idempotencyKey: customIdempotencyKey,
    rawPayload: body
  }, {
    authHeaderVerified: true,
    ipAddress: req.ip
  });

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error || 'Failed to process postback event',
      eventId: result.eventId
    });
    return;
  }

  res.json({
    success: true,
    isDuplicate: result.isDuplicate,
    reconciliation: {
      partnerId,
      partnerTransactionId: String(partnerTransactionId),
      mappedStatus: result.mappedStatus,
      purchaseAmount,
      grossCommission: commissionAmount,
      userRewardPoints: result.userRewardPoints,
      referrerRewardPoints: result.referrerRewardPoints,
      walletState: result.walletState,
      eventId: result.eventId,
      idempotencyKey: result.idempotencyKey,
      note: result.message || 'Transaction reconciled via authoritative server-side postback worker.'
    }
  });
});

/**
 * POST /api/affiliate/validate-transition
 * Validates state transition machine (PENDING -> CONFIRMED/CANCELLED/REFUNDED/REJECTED)
 */
affiliateServerRouter.post('/validate-transition', (req: Request, res: Response) => {
  const { currentStatus, nextStatus } = req.body;

  if (!currentStatus || !nextStatus) {
    res.status(400).json({
      success: false,
      error: 'Missing currentStatus or nextStatus'
    });
    return;
  }

  const result = ledgerWorkerService.validateStateTransition(
    currentStatus as StandardTransactionStatus,
    nextStatus as StandardTransactionStatus
  );

  res.json({
    success: result.isAllowed,
    isAllowed: result.isAllowed,
    error: result.reason
  });
});
