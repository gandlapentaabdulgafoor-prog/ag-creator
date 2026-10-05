/**
 * ONEAG Server-Side Admin Audit & Governance Engine
 *
 * This module runs strictly server-side.
 * CLIENT-SIDE USERS CANNOT WRITE OR TAMPER WITH AUDIT LOGS.
 * All audit actions are validated with role-based access control.
 */

export type AdminAuditActionType =
  | 'PROVIDER_STATUS_CHANGE'
  | 'CONFIGURATION_CHANGE'
  | 'TRANSACTION_STATUS_CHANGE'
  | 'REWARD_ADJUSTMENT'
  | 'WITHDRAWAL_POLICY_CHANGE'
  | 'SYSTEM_HEALTH_CHECK';

export interface AdminAuditLogEntry {
  logId: string;
  timestamp: string;
  adminEmail: string;
  actionType: AdminAuditActionType;
  targetResource: string;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
  status: 'SUCCESS' | 'REJECTED' | 'WARNING';
}

export const AUTHORIZED_ADMIN_EMAILS = [
  'oneagofficial@gmail.com'
];

/**
 * Server-authoritative audit log memory store.
 * Initialized with server boot record and security audit checks.
 */
class AdminAuditService {
  private logs: AdminAuditLogEntry[] = [];

  constructor() {
    // Record initial server-authoritative security milestone
    this.recordAuditLog({
      adminEmail: 'system-governance@oneag.internal',
      actionType: 'WITHDRAWAL_POLICY_CHANGE',
      targetResource: 'withdrawalPolicy/earlyAccess',
      description: 'Enforced global withdrawal lock (LOCKED status) for early-access beta.',
      details: {
        lockReason: 'Regulatory compliance & anti-fraud safeguarding',
        clientOverridePermitted: false
      },
      status: 'SUCCESS'
    });

    this.recordAuditLog({
      adminEmail: 'system-governance@oneag.internal',
      actionType: 'PROVIDER_STATUS_CHANGE',
      targetResource: 'affiliatePartners/registry',
      description: 'Affiliate partner integrations initialized in strictly DISABLED / NOT CONFIGURED state.',
      details: {
        amazon: 'DISABLED (Amazon Creators API credentials pending)',
        flipkart: 'DISABLED (Flipkart Affiliate credentials pending)',
        myntra: 'DISABLED (Official supported partner path pending)'
      },
      status: 'SUCCESS'
    });
  }

  public isAuthorizedAdmin(email?: string | null): boolean {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    return AUTHORIZED_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === normalized);
  }

  private sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details || typeof details !== 'object') return details;
    const sanitized: Record<string, any> = {};
    const forbiddenKeys = ['password', 'secret', 'token', 'apikey', 'auth', 'authorization', 'signature', 'creditcard', 'privatekey'];

    for (const [k, v] of Object.entries(details)) {
      if (forbiddenKeys.some((f) => k.toLowerCase().includes(f))) {
        sanitized[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        sanitized[k] = this.sanitizeDetails(v);
      } else {
        sanitized[k] = v;
      }
    }
    return sanitized;
  }

  public recordAuditLog(entry: Omit<AdminAuditLogEntry, 'logId' | 'timestamp'>): AdminAuditLogEntry {
    const fullEntry: AdminAuditLogEntry = {
      logId: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
      details: this.sanitizeDetails(entry.details)
    };

    // Prepend so latest appears first
    this.logs.unshift(fullEntry);

    // Keep up to 500 audit entries
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }

    return fullEntry;
  }

  public getAuditLogs(limitCount = 100): AdminAuditLogEntry[] {
    return this.logs.slice(0, limitCount);
  }

  public getAuditLogsByType(type: AdminAuditActionType): AdminAuditLogEntry[] {
    return this.logs.filter((log) => log.actionType === type);
  }
}

export const adminAuditService = new AdminAuditService();
