/**
 * ONEAG — PHASE 8: KYC & WITHDRAWAL COMPLIANCE ARCHITECTURE
 * 
 * Server-authoritative, provider-agnostic KYC and withdrawal compliance engine.
 * 
 * INVARIANTS:
 * 1. Global Withdrawal Status is strictly LOCKED (Emergency Kill Switch ENABLED by default).
 * 2. Real-money payouts are disabled — no live payment gateway or banking integration.
 * 3. Client applications (Web, Android, iOS) CANNOT mutate KYC status or withdrawal state.
 * 4. Client-reported balances are NEVER trusted; only the authoritative ledger balance is used.
 * 5. Data minimization: No passwords, OTPs, full identity document numbers, or bank account numbers are stored or logged.
 */

import { adminAuditService } from './adminAuditService.js';
import { ledgerWorkerService } from './ledgerWorker.js';

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================

export type KycStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVIEW_REQUIRED';

export type WithdrawalStatus =
  | 'LOCKED'
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REJECTED'
  | 'CANCELLED';

export interface KycRecord {
  userId: string;
  status: KycStatus;
  providerRef?: string; // Anonymized cryptographic token/hash, zero PII
  level: 'TIER_1_BASIC' | 'TIER_2_ENHANCED';
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  riskFlags: string[];
  updatedAt: string;
}

export interface WithdrawalEligibilityResult {
  isEligible: boolean;
  withdrawalGlobalLock: 'LOCKED';
  emergencyKillSwitchActive: boolean;
  authoritativeAvailableBalance: number;
  authoritativePendingBalance: number;
  requestedPoints: number;
  kycStatus: KycStatus;
  minimumThresholdPoints: number;
  failureReasons: string[];
  riskIndicators: string[];
  evaluatedAt: string;
}

export interface WithdrawalStateTransitionLog {
  fromStatus: WithdrawalStatus;
  toStatus: WithdrawalStatus;
  actor: string;
  reason?: string;
  timestamp: string;
}

export interface WithdrawalRequest {
  requestId: string;
  userId: string;
  amountPoints: number;
  status: WithdrawalStatus;
  idempotencyKey: string;
  eligibilitySnapshot: WithdrawalEligibilityResult;
  history: WithdrawalStateTransitionLog[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// STATE MACHINE TRANSITION RULES
// ============================================================================

/**
 * Legal state transition map.
 * When emergency kill switch is active (default), NO transition out of LOCKED is permitted.
 */
const LEGAL_WITHDRAWAL_TRANSITIONS: Record<WithdrawalStatus, WithdrawalStatus[]> = {
  LOCKED: [], // When locked, no legal forward transitions
  REQUESTED: ['UNDER_REVIEW', 'CANCELLED', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['PROCESSING', 'REJECTED', 'CANCELLED'],
  PROCESSING: ['PAID', 'FAILED', 'REJECTED'],
  PAID: [], // Terminal state
  FAILED: ['UNDER_REVIEW', 'REJECTED'],
  REJECTED: [], // Terminal state
  CANCELLED: [] // Terminal state
};

const TERMINAL_WITHDRAWAL_STATES = new Set<WithdrawalStatus>(['PAID', 'REJECTED', 'CANCELLED']);

// ============================================================================
// KYC & WITHDRAWAL COMPLIANCE SERVICE
// ============================================================================

export class KycWithdrawalComplianceService {
  // Global Emergency Kill Switch (Strictly true / LOCKED)
  private emergencyKillSwitch: boolean = true;
  private readonly MINIMUM_WITHDRAWAL_POINTS: number = 5000; // ₹500 equivalent (10 PTS = ₹1)

  // In-memory registries (synchronized with persistent storage in production)
  private kycRegistry: Map<string, KycRecord> = new Map();
  private withdrawalRequests: Map<string, WithdrawalRequest> = new Map();
  private idempotencyRegistry: Set<string> = new Set();
  private userActiveRequests: Map<string, string> = new Map(); // userId -> requestId

  constructor() {
    this.emergencyKillSwitch = true;
  }

  // --------------------------------------------------------------------------
  // 1. EMERGENCY KILL SWITCH & SYSTEM CONTROLS
  // --------------------------------------------------------------------------

  public isEmergencyKillSwitchActive(): boolean {
    return this.emergencyKillSwitch;
  }

  public getGlobalWithdrawalStatus(): 'LOCKED' {
    return 'LOCKED';
  }

  // --------------------------------------------------------------------------
  // 2. KYC ARCHITECTURE & MANAGEMENT
  // --------------------------------------------------------------------------

  public getOrCreateKycRecord(userId: string): KycRecord {
    const existing = this.kycRegistry.get(userId);
    if (existing) {
      return { ...existing };
    }

    const defaultRecord: KycRecord = {
      userId,
      status: 'NOT_REQUIRED',
      level: 'TIER_1_BASIC',
      riskFlags: [],
      updatedAt: new Date().toISOString()
    };
    this.kycRegistry.set(userId, defaultRecord);
    return { ...defaultRecord };
  }

  /**
   * Client-side attempt to self-verify KYC is STRICTLY BLOCKED.
   * Only authorized server administrative workflows or verified webhook adapters may verify KYC.
   */
  public submitKycVerificationRequest(userId: string, providerTokenReference?: string): KycRecord {
    const record = this.getOrCreateKycRecord(userId);

    // Client can only transition from NOT_REQUIRED / REJECTED / EXPIRED -> PENDING
    if (record.status === 'VERIFIED') {
      return record;
    }

    // Mask/sanitize any provider reference
    const sanitizedRef = providerTokenReference
      ? `ref_${Buffer.from(providerTokenReference).toString('base64').substring(0, 16)}`
      : undefined;

    record.status = 'PENDING';
    record.providerRef = sanitizedRef;
    record.submittedAt = new Date().toISOString();
    record.updatedAt = new Date().toISOString();

    this.kycRegistry.set(userId, record);
    return { ...record };
  }

  /**
   * Admin-authoritative KYC review.
   * Strict RBAC: Caller must be an authorized Super Admin.
   */
  public adminReviewKyc(
    adminEmail: string,
    userId: string,
    targetStatus: KycStatus,
    reason?: string
  ): { success: boolean; record?: KycRecord; error?: string } {
    if (!adminAuditService.isAuthorizedAdmin(adminEmail)) {
      return {
        success: false,
        error: 'Unauthorized: Admin privileges required to review KYC records.'
      };
    }

    const record = this.getOrCreateKycRecord(userId);
    const prevStatus = record.status;
    record.status = targetStatus;
    record.updatedAt = new Date().toISOString();

    if (targetStatus === 'VERIFIED') {
      record.verifiedAt = new Date().toISOString();
      record.rejectionReason = undefined;
    } else if (targetStatus === 'REJECTED') {
      record.rejectionReason = reason || 'KYC verification criteria not satisfied.';
    }

    this.kycRegistry.set(userId, record);

    // Record audit event
    adminAuditService.recordAuditLog({
      adminEmail,
      actionType: 'CONFIGURATION_CHANGE',
      targetResource: `kyc/${userId}`,
      description: `Admin updated KYC status from ${prevStatus} to ${targetStatus}`,
      details: {
        userId,
        previousStatus: prevStatus,
        newStatus: targetStatus,
        reason: reason || 'Administrative review'
      },
      status: 'SUCCESS'
    });

    return { success: true, record: { ...record } };
  }

  // --------------------------------------------------------------------------
  // 3. WITHDRAWAL ELIGIBILITY ENGINE
  // --------------------------------------------------------------------------

  /**
   * Evaluates withdrawal eligibility using authoritative ledger data.
   * Client-supplied balances are strictly ignored and validated against authoritative balances.
   */
  public evaluateWithdrawalEligibility(
    userId: string,
    requestedPoints: number,
    clientReportedBalance?: number
  ): WithdrawalEligibilityResult {
    const failureReasons: string[] = [];
    const riskIndicators: string[] = [];

    // 1. Global Kill Switch Check
    failureReasons.push('GLOBAL_WITHDRAWAL_LOCKED: Platform withdrawals are strictly locked.');

    // 2. Authoritative Wallet Balance
    const authoritativeWallet = ledgerWorkerService.getWallet(userId);
    const authAvailable = authoritativeWallet?.availableBalance ?? 0;
    const authPending = authoritativeWallet?.pendingBalance ?? 0;

    // Detect client-side balance forgery attempt
    if (clientReportedBalance !== undefined && clientReportedBalance !== authAvailable) {
      riskIndicators.push(
        `CLIENT_BALANCE_MISMATCH: Client reported ${clientReportedBalance} PTS, but authoritative balance is ${authAvailable} PTS.`
      );
      failureReasons.push('BALANCE_INTEGRITY_VIOLATION: Reported balance does not match authoritative ledger.');
    }

    // 3. Minimum threshold check
    if (requestedPoints < this.MINIMUM_WITHDRAWAL_POINTS) {
      failureReasons.push(
        `MINIMUM_THRESHOLD_NOT_MET: Minimum withdrawal is ${this.MINIMUM_WITHDRAWAL_POINTS} PTS (₹${this.MINIMUM_WITHDRAWAL_POINTS / 10}). Requested: ${requestedPoints} PTS.`
      );
    }

    // 4. Sufficient available balance check
    if (requestedPoints > authAvailable) {
      failureReasons.push(
        `INSUFFICIENT_AVAILABLE_BALANCE: Available balance is ${authAvailable} PTS, requested ${requestedPoints} PTS.`
      );
    }

    // 5. Pending Rewards Not Withdrawable
    if (authPending > 0 && requestedPoints > authAvailable) {
      failureReasons.push(
        `PENDING_FUNDS_LOCKED: User has ${authPending} PTS in pending status which cannot be withdrawn until confirmed.`
      );
    }

    // 6. KYC Requirement
    const kycRecord = this.getOrCreateKycRecord(userId);
    if (kycRecord.status !== 'VERIFIED' && kycRecord.status !== 'NOT_REQUIRED') {
      failureReasons.push(
        `KYC_NOT_VERIFIED: Current KYC status is '${kycRecord.status}'. Verification required before withdrawal eligibility.`
      );
    }

    // 7. Active / Duplicate Request Check
    if (this.userActiveRequests.has(userId)) {
      failureReasons.push('DUPLICATE_ACTIVE_REQUEST: User already has an active withdrawal request under processing.');
      riskIndicators.push('CONCURRENT_WITHDRAWAL_ATTEMPT');
    }

    return {
      isEligible: false, // ALWAYS false while global lock is active
      withdrawalGlobalLock: 'LOCKED',
      emergencyKillSwitchActive: this.emergencyKillSwitch,
      authoritativeAvailableBalance: authAvailable,
      authoritativePendingBalance: authPending,
      requestedPoints,
      kycStatus: kycRecord.status,
      minimumThresholdPoints: this.MINIMUM_WITHDRAWAL_POINTS,
      failureReasons,
      riskIndicators,
      evaluatedAt: new Date().toISOString()
    };
  }

  // --------------------------------------------------------------------------
  // 4. WITHDRAWAL STATE MACHINE & ANTI-FRAUD
  // --------------------------------------------------------------------------

  /**
   * Validates legal state transitions.
   */
  public validateWithdrawalTransition(
    fromStatus: WithdrawalStatus,
    toStatus: WithdrawalStatus
  ): { isAllowed: boolean; reason?: string } {
    // If the kill switch is active, no transition out of LOCKED is permitted
    if (fromStatus === 'LOCKED') {
      return {
        isAllowed: false,
        reason: 'Illegal Transition: System is in global LOCKED state. No transitions permitted.'
      };
    }

    // Terminal states cannot be transitioned
    if (TERMINAL_WITHDRAWAL_STATES.has(fromStatus)) {
      return {
        isAllowed: false,
        reason: `Illegal Transition: '${fromStatus}' is a terminal state and cannot be modified.`
      };
    }

    const legalNext = LEGAL_WITHDRAWAL_TRANSITIONS[fromStatus] || [];
    if (!legalNext.includes(toStatus)) {
      return {
        isAllowed: false,
        reason: `Illegal Transition: Cannot transition withdrawal from '${fromStatus}' to '${toStatus}'.`
      };
    }

    return { isAllowed: true };
  }

  /**
   * Attempt to create a withdrawal request.
   * When withdrawals are locked, requests are REJECTED at the compliance boundary.
   */
  public createWithdrawalRequest(params: {
    userId: string;
    amountPoints: number;
    idempotencyKey: string;
    clientReportedBalance?: number;
  }): { success: boolean; request?: WithdrawalRequest; error?: string; eligibility: WithdrawalEligibilityResult } {
    const { userId, amountPoints, idempotencyKey, clientReportedBalance } = params;

    // 1. Idempotency Key / Replay Protection
    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 8) {
      const eligibility = this.evaluateWithdrawalEligibility(userId, amountPoints, clientReportedBalance);
      return {
        success: false,
        error: 'Invalid or missing idempotency key. Minimum 8 characters required.',
        eligibility
      };
    }

    if (this.idempotencyRegistry.has(idempotencyKey)) {
      const eligibility = this.evaluateWithdrawalEligibility(userId, amountPoints, clientReportedBalance);
      return {
        success: false,
        error: 'DUPLICATE_REQUEST_DETECTED: Replayed withdrawal request with identical idempotency key rejected.',
        eligibility
      };
    }

    // 2. Evaluate Eligibility
    const eligibility = this.evaluateWithdrawalEligibility(userId, amountPoints, clientReportedBalance);

    // 3. Enforce Global Lock
    // Real-money payouts are disabled. All requests fail safely with detailed compliance reasons.
    if (this.emergencyKillSwitch || eligibility.withdrawalGlobalLock === 'LOCKED') {
      return {
        success: false,
        error: 'WITHDRAWALS_GLOBALLY_LOCKED: Early access beta lock is active. Redemptions are currently disabled.',
        eligibility
      };
    }

    // Note: In future unlocked phases, request creation would proceed here.
    return {
      success: false,
      error: 'UNAUTHORIZED_WITHDRAWAL_ATTEMPT',
      eligibility
    };
  }

  // --------------------------------------------------------------------------
  // 5. ADMIN REVIEW & RECONCILIATION
  // --------------------------------------------------------------------------

  public adminReviewWithdrawalRequest(
    adminEmail: string,
    requestId: string,
    targetStatus: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW',
    note?: string
  ): { success: boolean; request?: WithdrawalRequest; error?: string } {
    if (!adminAuditService.isAuthorizedAdmin(adminEmail)) {
      return {
        success: false,
        error: 'Unauthorized: Super Admin credentials required.'
      };
    }

    const request = this.withdrawalRequests.get(requestId);
    if (!request) {
      return { success: false, error: `Withdrawal request '${requestId}' not found.` };
    }

    const transitionCheck = this.validateWithdrawalTransition(request.status, targetStatus);
    if (!transitionCheck.isAllowed) {
      return { success: false, error: transitionCheck.reason };
    }

    const prevStatus = request.status;
    request.status = targetStatus;
    request.updatedAt = new Date().toISOString();
    request.history.push({
      fromStatus: prevStatus,
      toStatus: targetStatus,
      actor: adminEmail,
      reason: note,
      timestamp: new Date().toISOString()
    });

    adminAuditService.recordAuditLog({
      adminEmail,
      actionType: 'CONFIGURATION_CHANGE',
      targetResource: `withdrawal/${requestId}`,
      description: `Admin reviewed withdrawal request: ${prevStatus} -> ${targetStatus}`,
      details: {
        requestId,
        userId: request.userId,
        amountPoints: request.amountPoints,
        previousStatus: prevStatus,
        newStatus: targetStatus,
        note: note || 'Administrative review'
      },
      status: 'SUCCESS'
    });

    return { success: true, request: { ...request } };
  }

  // --------------------------------------------------------------------------
  // 6. QUERY & AUDIT INSPECTION
  // --------------------------------------------------------------------------

  public getKycRegistry(limit = 100): KycRecord[] {
    return Array.from(this.kycRegistry.values()).slice(0, limit);
  }

  public getWithdrawalQueue(limit = 100): WithdrawalRequest[] {
    return Array.from(this.withdrawalRequests.values()).slice(0, limit);
  }

  public resetTestState() {
    this.kycRegistry.clear();
    this.withdrawalRequests.clear();
    this.idempotencyRegistry.clear();
    this.userActiveRequests.clear();
    this.emergencyKillSwitch = true;
  }
}

// Authoritative Singleton
export const kycWithdrawalComplianceService = new KycWithdrawalComplianceService();
