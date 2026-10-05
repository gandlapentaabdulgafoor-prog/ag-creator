/**
 * ONEAG — PHASE 8: COMPLIANCE, KYC & WITHDRAWAL API ROUTES
 * 
 * Secure server-authoritative routing for KYC verification and withdrawal eligibility.
 * All financial movement remains strictly LOCKED under the early access beta guardrail.
 */

import { Router, Request, Response } from 'express';
import { kycWithdrawalComplianceService } from './kycWithdrawalService.js';
import { adminAuditService } from './adminAuditService.js';

export const complianceServerRouter = Router();

/**
 * Middleware: Verify Admin Role
 */
function requireAdminRole(req: Request, res: Response, next: () => void) {
  const adminEmail = (req.headers['x-admin-email'] as string) || '';
  let candidateEmail = adminEmail.trim().toLowerCase();

  if (!candidateEmail && req.query.adminEmail) {
    candidateEmail = String(req.query.adminEmail).trim().toLowerCase();
  }

  if (!candidateEmail || !adminAuditService.isAuthorizedAdmin(candidateEmail)) {
    res.status(403).json({
      success: false,
      error: 'Access Denied: Admin authorization required.',
      message: 'This endpoint is restricted to authenticated ONEAG administrators.'
    });
    return;
  }

  (req as any).adminEmail = candidateEmail;
  next();
}

/**
 * GET /api/compliance/status
 * Public compliance posture inspection.
 */
complianceServerRouter.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    platform: 'ONEAG Multi-Platform Network',
    withdrawalGlobalLock: kycWithdrawalComplianceService.getGlobalWithdrawalStatus(),
    emergencyKillSwitchActive: kycWithdrawalComplianceService.isEmergencyKillSwitchActive(),
    kycRequirement: {
      providerModel: 'Provider-Agnostic Decentralized Token Verification',
      allowedStatuses: [
        'NOT_REQUIRED',
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'EXPIRED',
        'REVIEW_REQUIRED'
      ],
      clientSelfVerificationPermitted: false
    },
    bankingGateway: {
      status: 'NOT_CONNECTED',
      payoutGatewayIntegrated: false,
      reason: 'Financial safety guardrail: Phase 8 is compliance architecture preparation only.'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/compliance/kyc-status/:userId
 * Inspect KYC status for a user.
 */
complianceServerRouter.get('/kyc-status/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ success: false, error: 'Missing userId parameter.' });
    return;
  }

  const record = kycWithdrawalComplianceService.getOrCreateKycRecord(userId);
  res.json({
    success: true,
    kyc: {
      userId: record.userId,
      status: record.status,
      level: record.level,
      riskFlags: record.riskFlags,
      updatedAt: record.updatedAt
    }
  });
});

/**
 * POST /api/compliance/submit-kyc
 * User initiates verification request (transitions to PENDING).
 * Clients CANNOT mark themselves VERIFIED.
 */
complianceServerRouter.post('/submit-kyc', (req: Request, res: Response) => {
  const { userId, providerTokenReference, requestedStatus } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, error: 'userId is required.' });
    return;
  }

  // Security check: If client attempts to forge 'VERIFIED' status
  if (requestedStatus === 'VERIFIED') {
    res.status(403).json({
      success: false,
      error: 'SECURITY_ALERT: Client cannot self-certify KYC as VERIFIED. Request submitted as PENDING only.'
    });
    return;
  }

  const record = kycWithdrawalComplianceService.submitKycVerificationRequest(userId, providerTokenReference);
  res.json({
    success: true,
    message: 'KYC verification request submitted for backend evaluation.',
    kyc: {
      userId: record.userId,
      status: record.status,
      level: record.level,
      updatedAt: record.updatedAt
    }
  });
});

/**
 * POST /api/compliance/check-eligibility
 * Check whether user meets withdrawal conditions.
 * Authoritative: checks server ledger balances and rejects forged client balances.
 */
complianceServerRouter.post('/check-eligibility', (req: Request, res: Response) => {
  const { userId, requestedPoints, clientReportedBalance } = req.body;

  if (!userId || typeof requestedPoints !== 'number') {
    res.status(400).json({
      success: false,
      error: 'Missing required fields: userId (string) and requestedPoints (number).'
    });
    return;
  }

  const evaluation = kycWithdrawalComplianceService.evaluateWithdrawalEligibility(
    userId,
    requestedPoints,
    clientReportedBalance
  );

  res.json({
    success: true,
    evaluation
  });
});

/**
 * POST /api/compliance/request-withdrawal
 * Withdrawal request endpoint.
 * STRICT ENFORCEMENT: System is globally LOCKED; request is safely rejected at compliance boundary.
 */
complianceServerRouter.post('/request-withdrawal', (req: Request, res: Response) => {
  const { userId, amountPoints, idempotencyKey, clientReportedBalance } = req.body;

  if (!userId || typeof amountPoints !== 'number') {
    res.status(400).json({
      success: false,
      error: 'Missing userId or amountPoints.'
    });
    return;
  }

  const result = kycWithdrawalComplianceService.createWithdrawalRequest({
    userId,
    amountPoints,
    idempotencyKey,
    clientReportedBalance
  });

  res.status(result.success ? 200 : 403).json(result);
});

// ============================================================================
// ADMIN COMPLIANCE CONTROLS
// ============================================================================

/**
 * GET /api/compliance/admin/kyc-queue
 */
complianceServerRouter.get('/admin/kyc-queue', requireAdminRole, (_req: Request, res: Response) => {
  const list = kycWithdrawalComplianceService.getKycRegistry(100);
  res.json({
    success: true,
    total: list.length,
    records: list
  });
});

/**
 * POST /api/compliance/admin/review-kyc
 */
complianceServerRouter.post('/admin/review-kyc', requireAdminRole, (req: Request, res: Response) => {
  const { userId, targetStatus, reason } = req.body;
  const adminEmail = (req as any).adminEmail || 'admin@oneag.internal';

  if (!userId || !targetStatus) {
    res.status(400).json({ success: false, error: 'Missing userId or targetStatus.' });
    return;
  }

  const result = kycWithdrawalComplianceService.adminReviewKyc(
    adminEmail,
    userId,
    targetStatus,
    reason
  );

  res.status(result.success ? 200 : 400).json(result);
});

/**
 * GET /api/compliance/admin/withdrawal-queue
 */
complianceServerRouter.get('/admin/withdrawal-queue', requireAdminRole, (_req: Request, res: Response) => {
  const queue = kycWithdrawalComplianceService.getWithdrawalQueue(100);
  res.json({
    success: true,
    total: queue.length,
    queue
  });
});

/**
 * POST /api/compliance/admin/review-withdrawal
 */
complianceServerRouter.post('/admin/review-withdrawal', requireAdminRole, (req: Request, res: Response) => {
  const { requestId, targetStatus, note } = req.body;
  const adminEmail = (req as any).adminEmail || 'admin@oneag.internal';

  if (!requestId || !targetStatus) {
    res.status(400).json({ success: false, error: 'Missing requestId or targetStatus.' });
    return;
  }

  const result = kycWithdrawalComplianceService.adminReviewWithdrawalRequest(
    adminEmail,
    requestId,
    targetStatus,
    note
  );

  res.status(result.success ? 200 : 400).json(result);
});
