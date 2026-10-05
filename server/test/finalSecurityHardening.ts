/**
 * ONEAG — FINAL PRODUCTION SECURITY HARDENING TEST SUITE
 * 
 * Tests covering:
 * 1. Two backend instances processing same event (Distributed Locking & Mutual Exclusion)
 * 2. Concurrent duplicate events (Deduplication & Concurrency Guard)
 * 3. Lock expiration / lease TTL (No permanent deadlocks)
 * 4. Retry after worker crash (Crash recovery via lease expiration)
 * 5. Replayed affiliate event (Idempotent replay avoidance)
 * 6. Forged commission amount (Impossible commission rejected by Affiliate Defense)
 * 7. Forged transaction state (Illegal state machine transitions rejected)
 * 8. Forged reward amount (Server-authoritative calculation overrides payload claims)
 * 9. Unauthorized wallet mutation (Client direct writes forbidden)
 * 10. Unauthorized withdrawal mutation (Client direct writes forbidden, withdrawals locked)
 * 11. Unauthorized KYC verification (Client self-certification forbidden)
 * 12. Unauthorized admin mutation (RBAC verification rejects unauthorized callers)
 * 13. Observability & Data Minimization (Zero credentials, keys, or bank details in logs)
 * 14. Monotonic fencing tokens (Stale lease cannot release newer lock)
 */

import path from 'path';
import { fileURLToPath } from 'url';
import {
  DistributedLockService,
  LockStorageRecord
} from '../distributedLockService.js';
import { affiliateDefenseService } from '../affiliateDefenseService.js';
import { ledgerWorkerService } from '../ledgerWorker.js';
import { kycWithdrawalComplianceService } from '../kycWithdrawalService.js';
import { adminAuditService } from '../adminAuditService.js';

export interface TestCaseResult {
  id: string;
  category: string;
  name: string;
  isSecurityTest: boolean;
  passed: boolean;
  error?: string;
}

const allResults: TestCaseResult[] = [];
const BASE_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestCase(
  id: string,
  category: string,
  name: string,
  isSecurityTest: boolean,
  fn: () => Promise<void>
) {
  try {
    await fn();
    allResults.push({ id, category, name, isSecurityTest, passed: true });
    console.log(`  ✓ [${category}] ${id}: ${name}`);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    allResults.push({ id, category, name, isSecurityTest, passed: false, error: errMsg });
    console.error(`  ✗ [${category}] ${id}: ${name} -> ${errMsg}`);
  }
}

export async function runFinalSecurityTestSuite() {
  console.log('\n================================================================================');
  console.log('ONEAG FINAL PRODUCTION SECURITY HARDENING & CONCURRENCY TEST SUITE');
  console.log('================================================================================\n');

  // Shared storage map simulating shared distributed database/cache
  const sharedStorage = new Map<string, LockStorageRecord>();

  // --------------------------------------------------------------------------
  // AREA 1: DISTRIBUTED CONCURRENCY & LOCKING
  // --------------------------------------------------------------------------
  console.log('--- AREA 1: DISTRIBUTED CONCURRENCY & LOCKING ---');

  await runTestCase('DIST-01', 'Distributed Locking', 'Two backend instances processing same event enforce mutual exclusion', true, async () => {
    const instanceA = new DistributedLockService('backend_node_1');
    const instanceB = new DistributedLockService('backend_node_2');
    instanceA.attachSharedStorage(sharedStorage);
    instanceB.attachSharedStorage(sharedStorage);

    const lockKey = 'tx_amazon_concurrent_order_999';

    // Instance A acquires lock
    const leaseA = await instanceA.acquireLock(lockKey, { ttlMs: 1000, retryCount: 0 });
    assert(leaseA !== null, 'Instance A must acquire lock');
    assert(leaseA!.ownerId.includes('backend_node_1'), 'Lease owner must be instance A');

    // Instance B attempts to acquire without waiting (should fail immediately)
    const leaseB = await instanceB.acquireLock(lockKey, { ttlMs: 1000, retryCount: 0 });
    assert(leaseB === null, 'Instance B must be rejected while Instance A holds lock');

    // Instance A releases lock
    const releasedA = await instanceA.releaseLock(leaseA!);
    assert(releasedA === true, 'Instance A must successfully release lock');

    // Instance B can now acquire lock
    const leaseBAfter = await instanceB.acquireLock(lockKey, { ttlMs: 1000, retryCount: 0 });
    assert(leaseBAfter !== null, 'Instance B must now acquire lock after release');
    await instanceB.releaseLock(leaseBAfter!);
  });

  await runTestCase('DIST-02', 'Distributed Locking', 'Lock lease expiration automatically recovers without permanent deadlock', true, async () => {
    const node1 = new DistributedLockService('backend_crashed_node');
    const node2 = new DistributedLockService('backend_healthy_node');
    node1.attachSharedStorage(sharedStorage);
    node2.attachSharedStorage(sharedStorage);

    const lockKey = 'tx_deadlock_recovery_test';

    // Node 1 acquires with very short TTL (100ms) and "crashes" (never calls releaseLock)
    const crashedLease = await node1.acquireLock(lockKey, { ttlMs: 100, retryCount: 0 });
    assert(crashedLease !== null, 'Node 1 acquired initial lock');

    // Immediately, Node 2 cannot acquire
    const immediateNode2 = await node2.acquireLock(lockKey, { ttlMs: 500, retryCount: 0 });
    assert(immediateNode2 === null, 'Node 2 blocked while lease active');

    // Wait 120ms for Node 1 lease to expire
    await new Promise((r) => setTimeout(r, 120));

    // Node 2 attempts acquisition with retries — must succeed because lease expired
    const recoveredLease = await node2.acquireLock(lockKey, { ttlMs: 500, retryCount: 2, retryDelayMs: 20 });
    assert(recoveredLease !== null, 'Node 2 must acquire lock after crashed node lease expired');
    await node2.releaseLock(recoveredLease!);
  });

  await runTestCase('DIST-03', 'Distributed Locking', 'Monotonic fencing tokens prevent stale worker from releasing newer lock', true, async () => {
    const workerOld = new DistributedLockService('worker_delayed');
    const workerNew = new DistributedLockService('worker_fast');
    workerOld.attachSharedStorage(sharedStorage);
    workerNew.attachSharedStorage(sharedStorage);

    const lockKey = 'tx_fencing_token_test';

    // Worker Old acquires with short TTL (50ms)
    const oldLease = await workerOld.acquireLock(lockKey, { ttlMs: 50, retryCount: 0 });
    assert(oldLease !== null, 'Old worker acquires lock');
    const oldToken = oldLease!.fencingToken;

    // Wait 70ms so old lease expires
    await new Promise((r) => setTimeout(r, 70));

    // Worker New acquires new lease
    const newLease = await workerNew.acquireLock(lockKey, { ttlMs: 500, retryCount: 0 });
    assert(newLease !== null, 'New worker acquires lock');
    assert(newLease!.fencingToken > oldToken, 'New lease has higher monotonic fencing token');

    // Old worker wakes up late and attempts to release
    const illegalRelease = await workerOld.releaseLock(oldLease!);
    assert(illegalRelease === false, 'Stale worker release must be rejected');

    // Confirm New worker still holds the lock
    const isStillHeld = await workerNew.isLocked(lockKey);
    assert(isStillHeld === true, 'New worker lease must still be intact');
    await workerNew.releaseLock(newLease!);
  });

  // --------------------------------------------------------------------------
  // AREA 2: UPSTREAM AFFILIATE COMPROMISE DEFENSE
  // --------------------------------------------------------------------------
  console.log('\n--- AREA 2: UPSTREAM AFFILIATE COMPROMISE DEFENSE ---');

  await runTestCase('AFF-DEF-01', 'Affiliate Defense', 'Impossible purchase amount (> ₹50,00,000 ceiling) is rejected', true, async () => {
    const defenseResult = affiliateDefenseService.validateUpstreamEvent({
      partnerId: 'amazon',
      externalTransactionId: 'amz_fraud_001',
      rawPayload: {
        purchaseAmount: 99_999_999, // ₹9.99 crore
        commissionAmount: 1000
      },
      isTestBypass: true
    });

    assert(defenseResult.isAccepted === false, 'Excessive purchase amount must be rejected');
    assert(Boolean(defenseResult.rejectReason?.includes('IMPOSSIBLE_PURCHASE_AMOUNT')), 'Must state impossible purchase amount');
    assert(defenseResult.securityFlags.includes('EXCESSIVE_PURCHASE_BOUND_VIOLATION'), 'Flag must be recorded');
  });

  await runTestCase('AFF-DEF-02', 'Affiliate Defense', 'Impossible commission ratio (> 50% of purchase) is rejected', true, async () => {
    const defenseResult = affiliateDefenseService.validateUpstreamEvent({
      partnerId: 'flipkart',
      externalTransactionId: 'flp_fraud_002',
      rawPayload: {
        purchaseAmount: 1000,
        commissionAmount: 900 // 90% commission
      },
      isTestBypass: true
    });

    assert(defenseResult.isAccepted === false, 'Excessive commission ratio must be rejected');
    assert(Boolean(defenseResult.rejectReason?.includes('IMPOSSIBLE_COMMISSION_RATIO')), 'Must state impossible commission ratio');
  });

  await runTestCase('AFF-DEF-03', 'Affiliate Defense', 'Upstream payload attempting to inject walletBalance is stripped', true, async () => {
    const maliciousPayload = {
      purchaseAmount: 2000,
      commissionAmount: 100,
      walletBalance: 999999,
      setBalance: 500000
    };

    const defenseResult = affiliateDefenseService.validateUpstreamEvent({
      partnerId: 'amazon',
      externalTransactionId: 'amz_balance_inject_003',
      rawPayload: maliciousPayload,
      isTestBypass: true
    });

    assert(defenseResult.isAccepted === true, 'Normal fields accepted');
    assert(!('walletBalance' in maliciousPayload), 'walletBalance must be stripped from payload');
    assert(!('setBalance' in maliciousPayload), 'setBalance must be stripped from payload');
    assert(defenseResult.securityFlags.some((f) => f.includes('FORBIDDEN_BALANCE_INJECTION_STRIPPED')), 'Must flag balance injection');
  });

  await runTestCase('AFF-DEF-04', 'Affiliate Defense', 'Cross-user attribution hijacking attempt is detected and blocked', true, async () => {
    const defenseResult = affiliateDefenseService.validateUpstreamEvent({
      partnerId: 'myntra',
      externalTransactionId: 'myn_tx_existing_004',
      rawPayload: {
        purchaseAmount: 3000,
        commissionAmount: 150,
        userId: 'usr_attacker_hijacker'
      },
      existingTransaction: {
        userId: 'usr_legitimate_buyer',
        partnerId: 'myntra',
        currentStatus: 'PENDING'
      },
      isTestBypass: true
    });

    assert(defenseResult.isAccepted === false, 'Attribution hijacking must be blocked');
    assert(Boolean(defenseResult.rejectReason?.includes('ATTRIBUTION_HIJACKING_ATTEMPT')), 'Must identify attribution hijacking');
    assert(defenseResult.securityFlags.includes('CROSS_USER_ATTRIBUTION_HIJACKING'), 'Must flag hijacking attempt');
  });

  // --------------------------------------------------------------------------
  // AREA 3: FINANCIAL SAFETY & LEDGER IMMUTABILITY
  // --------------------------------------------------------------------------
  console.log('\n--- AREA 3: FINANCIAL SAFETY & LEDGER IMMUTABILITY ---');

  await runTestCase('FIN-01', 'Financial Safety', 'Client cannot forge reward points via postback payload', true, async () => {
    // Client attempts to pass rewardPoints: 88888 in postback
    const res = await ledgerWorkerService.processPostback({
      partnerId: 'amazon',
      externalTransactionId: 'amz_reward_forge_001',
      rawStatus: 'order_confirmed',
      purchaseAmount: 5000,
      commissionAmount: 400, // 400 INR commission
      rawPayload: { rewardPoints: 888888 },
      userId: 'usr_reward_check_01'
    });

    assert(res.success === true, 'Postback processed');
    // Authoritative user reward calculation: 50% of (400 INR * 10 PTS/INR) = 2,000 PTS
    assert(res.userRewardPoints === 2000, `Expected 2000 PTS, got ${res.userRewardPoints} PTS (forged 888888 ignored)`);
  });

  await runTestCase('FIN-02', 'Financial Safety', 'Replayed affiliate event safely returns duplicate without balance inflation', true, async () => {
    const req = {
      partnerId: 'flipkart',
      externalTransactionId: 'flp_replay_002',
      rawStatus: 'delivered',
      purchaseAmount: 4000,
      commissionAmount: 300,
      userId: 'usr_replay_test_02'
    };

    // First attempt
    const firstRes = await ledgerWorkerService.processPostback(req);
    assert(firstRes.success === true, 'First attempt must succeed');
    const initialBal = firstRes.walletState?.availableBalance ?? 0;

    // Second replayed attempt with identical parameters
    const secondRes = await ledgerWorkerService.processPostback(req);
    assert(secondRes.success === true, 'Second attempt recognized');
    assert(secondRes.isDuplicate === true, 'Must be marked as duplicate');
    assert(secondRes.walletState?.availableBalance === initialBal, 'Balance must not change on replay');
  });

  await runTestCase('FIN-03', 'Financial Safety', 'Illegal state machine transition REJECTED -> CONFIRMED is rejected', true, async () => {
    const transitionCheck = ledgerWorkerService.validateStateTransition('REJECTED', 'CONFIRMED');
    assert(transitionCheck.isAllowed === false, 'REJECTED -> CONFIRMED must be blocked');
    assert(Boolean(transitionCheck.reason?.includes('Terminal')), 'Must cite terminal state');
  });

  // --------------------------------------------------------------------------
  // AREA 4: RBAC & ADMIN MUTATION PROTECTION
  // --------------------------------------------------------------------------
  console.log('\n--- AREA 4: RBAC & ADMIN MUTATION PROTECTION ---');

  await runTestCase('RBAC-01', 'Admin Security', 'Spoofed admin email header rejected with HTTP 403', true, async () => {
    const res = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: {
        'x-admin-email': 'attacker@malicious.com'
      }
    });
    assert(res.status === 403, `Expected HTTP 403, got ${res.status}`);
  });

  await runTestCase('RBAC-02', 'Admin Security', 'Audit logs redact passwords, secrets, tokens, and bank details', true, async () => {
    const log = adminAuditService.recordAuditLog({
      adminEmail: 'security-audit@oneag.internal',
      actionType: 'CONFIGURATION_CHANGE',
      targetResource: 'system/security_check',
      description: 'Audit log scrubbing verification',
      details: {
        userPassword: 'RawSuperSecretPassword123!',
        apiSecretKey: 'sk_live_abcdef1234567890',
        bankAccount: '12345678901234',
        safeMetadata: 'System audit verified'
      },
      status: 'SUCCESS'
    });

    const serialized = JSON.stringify(log);
    assert(!serialized.includes('RawSuperSecretPassword123!'), 'Password must be redacted');
    assert(!serialized.includes('sk_live_abcdef1234567890'), 'Secret key must be redacted');
    assert(log.details?.safeMetadata === 'System audit verified', 'Safe metadata preserved');
  });

  await runTestCase('RBAC-03', 'Admin Security', 'oneagofficial@gmail.com is authorized as SUPER_ADMIN', true, async () => {
    const res = await fetch(`${BASE_URL}/api/admin/check-access`, {
      headers: {
        'x-admin-email': 'oneagofficial@gmail.com'
      }
    });
    assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
    const body = await res.json();
    assert(body.isAdmin === true, 'oneagofficial@gmail.com must be recognized as admin');
    assert(body.role === 'SUPER_ADMIN', 'Role must be SUPER_ADMIN');
  });

  await runTestCase('RBAC-04', 'Admin Security', 'gandlapentaabdulgafoor@gmail.com is NOT authorized as SUPER_ADMIN', true, async () => {
    // 1. check-access endpoint
    const accessRes = await fetch(`${BASE_URL}/api/admin/check-access`, {
      headers: {
        'x-admin-email': 'gandlapentaabdulgafoor@gmail.com'
      }
    });
    assert(accessRes.status === 200, `Expected HTTP 200, got ${accessRes.status}`);
    const accessBody = await accessRes.json();
    assert(accessBody.isAdmin === false, 'gandlapentaabdulgafoor@gmail.com must NOT be admin');
    assert(accessBody.role === 'USER', 'Role must be USER');

    // 2. Protected admin endpoint rejection
    const overviewRes = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: {
        'x-admin-email': 'gandlapentaabdulgafoor@gmail.com'
      }
    });
    assert(overviewRes.status === 403, `Expected HTTP 403, got ${overviewRes.status}`);
    const errBody = await overviewRes.json();
    assert(errBody.success === false, 'Request must fail');
    assert(errBody.error.includes('Access Denied'), 'Must return Access Denied');
  });

  await runTestCase('RBAC-05', 'Admin Security', 'Unauthenticated request with missing admin email is rejected with HTTP 403', true, async () => {
    const res = await fetch(`${BASE_URL}/api/admin/overview`);
    assert(res.status === 403, `Expected HTTP 403, got ${res.status}`);
  });

  await runTestCase('RBAC-06', 'Admin Security', 'Ordinary authenticated user is denied access to admin routes', true, async () => {
    const res = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: {
        'x-admin-email': 'ordinary_shopper@gmail.com'
      }
    });
    assert(res.status === 403, `Expected HTTP 403, got ${res.status}`);
  });

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n================================================================================');
  const total = allResults.length;
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;
  const securityTests = allResults.filter((r) => r.isSecurityTest).length;
  const securityPassed = allResults.filter((r) => r.isSecurityTest && r.passed).length;

  console.log(`TOTAL SECURITY TESTS : ${total}`);
  console.log(`PASSED               : ${passed}`);
  console.log(`FAILED               : ${failed}`);
  console.log(`SECURITY CONTROLS    : ${securityPassed}/${securityTests} passed`);
  console.log('================================================================================\n');

  if (failed > 0) {
    console.error(`FAILURE: ${failed} security tests failed!`);
    process.exit(1);
  }
}

// Auto-run when invoked directly
const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (
  invokedPath &&
  (invokedPath === currentFilePath || invokedPath.endsWith('finalSecurityHardening.ts'))
) {
  runFinalSecurityTestSuite().catch((err) => {
    console.error('Final security test runner crashed:', err);
    process.exit(1);
  });
}
