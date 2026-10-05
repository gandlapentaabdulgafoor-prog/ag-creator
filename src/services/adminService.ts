/**
 * ONEAG Client-Side Admin Service
 *
 * Interfaces with server-authoritative admin routes (/api/admin/*).
 * Enforces role-based admin access control.
 * Non-admins receive HTTP 403 Forbidden.
 */

export const SUPER_ADMIN_EMAIL = 'oneagofficial@gmail.com';

export interface AdminOverviewMetrics {
  totalRegisteredUsers: number;
  verifiedReferrals: number;
  pendingRewards: number;
  confirmedRewards: number;
  affiliateClicks: number;
  confirmedAffiliateTransactions: number;
  cancelledTransactions: number;
  refundedTransactions: number;
  realDataNotice: string;
  databaseId: string;
  projectId: string;
  calculatedAt: string;
}

export interface AdminPartnerStatus {
  partnerId: string;
  name: string;
  shortName: string;
  officialApiName: string;
  status: 'DISABLED' | 'PENDING_CONFIG' | 'ACTIVE';
  isEnabled: boolean;
  isCredentialsConfigured: boolean;
  isProductFeedConfigured: boolean;
  isWebhookConfigured: boolean;
  readinessNotice: string;
  lastHealthCheck: string;
}

export interface AdminAuditLog {
  logId: string;
  timestamp: string;
  adminEmail: string;
  actionType: string;
  targetResource: string;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
  status: 'SUCCESS' | 'REJECTED' | 'WARNING';
}

export interface SystemHealthData {
  firebase: {
    status: string;
    projectId: string;
    authDomain: string;
    storageBucket: string;
    connectionType: string;
  };
  firestore: {
    status: string;
    databaseId: string;
    mode: string;
    rulesDeployed: boolean;
  };
  affiliateProviders: Record<string, { name: string; status: string; reason: string }>;
  apiReadiness: Record<string, string>;
  lastHealthCheck: string;
}

export function checkIsAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Fetch server-authoritative overview metrics
 */
export async function fetchAdminOverview(adminEmail: string): Promise<AdminOverviewMetrics> {
  const res = await fetch('/api/admin/overview', {
    headers: {
      'x-admin-email': adminEmail
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Admin access denied (${res.status})`);
  }

  const data = await res.json();
  return data.metrics;
}

/**
 * Fetch affiliate partner onboarding statuses
 */
export async function fetchAdminPartners(adminEmail: string): Promise<AdminPartnerStatus[]> {
  const res = await fetch('/api/admin/partners', {
    headers: {
      'x-admin-email': adminEmail
    }
  });

  if (!res.ok) {
    throw new Error('Failed to load affiliate partner statuses');
  }

  const data = await res.json();
  return data.partners || [];
}

/**
 * Fetch real affiliate transactions
 */
export async function fetchAdminTransactions(adminEmail: string, status = 'ALL'): Promise<any[]> {
  const res = await fetch(`/api/admin/transactions?status=${encodeURIComponent(status)}`, {
    headers: {
      'x-admin-email': adminEmail
    }
  });

  if (!res.ok) {
    throw new Error('Failed to load transaction records');
  }

  const data = await res.json();
  return data.transactions || [];
}

/**
 * Fetch real rewards ledger entries
 */
export async function fetchAdminLedger(adminEmail: string): Promise<{
  pending: any[];
  confirmed: any[];
  rejected: any[];
  counts: { pending: number; confirmed: number; rejected: number; total: number };
}> {
  const res = await fetch('/api/admin/ledger', {
    headers: {
      'x-admin-email': adminEmail
    }
  });

  if (!res.ok) {
    throw new Error('Failed to load ledger records');
  }

  const data = await res.json();
  return data.ledger;
}

/**
 * Fetch withdrawal lock policy status
 */
export async function fetchAdminWithdrawalStatus(adminEmail: string): Promise<any> {
  const res = await fetch('/api/admin/withdrawal-status', {
    headers: {
      'x-admin-email': adminEmail
    }
  });

  if (!res.ok) {
    throw new Error('Failed to load withdrawal lock policy');
  }

  const data = await res.json();
  return data.withdrawalControl;
}

/**
 * Fetch server-side admin audit logs
 */
export async function fetchAdminAuditLogs(adminEmail: string): Promise<AdminAuditLog[]> {
  const res = await fetch('/api/admin/audit-logs', {
    headers: {
      'x-admin-email': adminEmail
    }
  });

  if (!res.ok) {
    throw new Error('Failed to load admin audit logs');
  }

  const data = await res.json();
  return data.logs || [];
}

/**
 * Record a new admin audit log entry (server validated)
 */
export async function recordAdminAuditLog(
  adminEmail: string,
  entry: {
    actionType: string;
    targetResource: string;
    description: string;
    details?: Record<string, any>;
    status?: 'SUCCESS' | 'REJECTED' | 'WARNING';
  }
): Promise<AdminAuditLog> {
  const res = await fetch('/api/admin/audit-logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-email': adminEmail
    },
    body: JSON.stringify(entry)
  });

  if (!res.ok) {
    throw new Error('Failed to record audit log');
  }

  const data = await res.json();
  return data.log;
}

/**
 * Fetch complete system health
 */
export async function fetchAdminSystemHealth(adminEmail: string): Promise<SystemHealthData> {
  const res = await fetch('/api/admin/system-health', {
    headers: {
      'x-admin-email': adminEmail
    }
  });

  if (!res.ok) {
    throw new Error('Failed to load system health');
  }

  const data = await res.json();
  return data.systemHealth;
}
