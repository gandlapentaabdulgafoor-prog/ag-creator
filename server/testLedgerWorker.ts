/**
 * ONEAG Phase 4 Automated Test Suite
 * 
 * Verifies Backend Ledger Worker & Postback Persistence:
 * 1. Valid pending event
 * 2. Valid confirmation
 * 3. Cancellation
 * 4. Refund
 * 5. Rejection
 * 6. Duplicate event protection (idempotency)
 * 7. Replayed event protection
 * 8. Invalid transition prevention (e.g. REJECTED -> CONFIRMED)
 * 9. Forged client balance protection (authoritative calculation)
 * 10. Forged reward amount protection (authoritative rule override)
 * 11. Concurrent processing protection (mutex locking & serialized mutations)
 * 12. Retry after failure behavior
 */

import { ledgerWorkerService } from './ledgerWorker.js';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  PASS: ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err?.message || String(err) });
    console.error(`  FAIL: ${name} -> ${err?.message || err}`);
  }
}

async function executeAllTests() {
  console.log('================================================================');
  console.log('ONEAG PHASE 4 — BACKEND LEDGER WORKER & POSTBACK TEST SUITE');
  console.log('================================================================\n');

  // Test 1: Valid Pending Event
  await runTest('1. Valid Pending Event', async () => {
    const userId = 'usr_test_alpha';
    const txId = 'ord_test_pending_001';

    const res = await ledgerWorkerService.processPostback({
      partnerId: 'amazon',
      externalTransactionId: txId,
      rawStatus: 'in_transit',
      purchaseAmount: 2000,
      commissionAmount: 200,
      userId,
      currency: 'INR'
    });

    assert(res.success === true, 'Response must be success');
    assert(res.mappedStatus === 'PENDING', 'Mapped status must be PENDING');
    assert(!res.isDuplicate, 'Must not be duplicate');

    const wallet = ledgerWorkerService.getWallet(userId);
    assert(wallet !== undefined && wallet !== null, 'Wallet must be initialized');
    if (!wallet) throw new Error('Wallet missing');
    assert(wallet.pendingBalance === 1000, `Pending balance should be 1000 (50% of 200 INR * 10 pts/INR), got ${wallet.pendingBalance}`);
    assert(wallet.availableBalance === 0, `Available balance must remain 0 for pending event, got ${wallet.availableBalance}`);
    assert(wallet.withdrawalStatus === 'LOCKED', 'Withdrawal must remain LOCKED');
  });

  // Test 2: Valid Confirmation Event
  await runTest('2. Valid Confirmation Event', async () => {
    const userId = 'usr_test_beta';
    const txId = 'ord_test_confirm_002';

    // Step A: First submit pending event
    await ledgerWorkerService.processPostback({
      partnerId: 'flipkart',
      externalTransactionId: txId,
      rawStatus: 'in_transit',
      purchaseAmount: 1500,
      commissionAmount: 150,
      userId,
      currency: 'INR'
    });

    // Step B: Submit confirmed event
    const res = await ledgerWorkerService.processPostback({
      partnerId: 'flipkart',
      externalTransactionId: txId,
      rawStatus: 'completed',
      purchaseAmount: 1500,
      commissionAmount: 150,
      userId,
      currency: 'INR'
    });

    assert(res.success === true, 'Confirmation must succeed');
    assert(res.mappedStatus === 'CONFIRMED', 'Status must be CONFIRMED');

    const wallet = ledgerWorkerService.getWallet(userId);
    assert(wallet !== undefined && wallet !== null, 'Wallet must exist');
    if (!wallet) throw new Error('Wallet missing');
    assert(wallet.availableBalance === 750, `Available balance must be 750 (50% of 150 INR * 10 pts), got ${wallet.availableBalance}`);
    assert(wallet.pendingBalance === 0, `Pending balance must be released to 0, got ${wallet.pendingBalance}`);
    assert(wallet.totalEarned === 750, `Total earned must be 750, got ${wallet.totalEarned}`);
  });

  // Test 3: Cancellation Event
  await runTest('3. Cancellation Event', async () => {
    const userId = 'usr_test_gamma';
    const txId = 'ord_test_cancel_003';

    // Pending event
    await ledgerWorkerService.processPostback({
      partnerId: 'myntra',
      externalTransactionId: txId,
      rawStatus: 'order_placed',
      purchaseAmount: 1200,
      commissionAmount: 120,
      userId,
      currency: 'INR'
    });

    const walletBefore = ledgerWorkerService.getWallet(userId);
    assert(walletBefore?.pendingBalance === 600, 'Pending balance before cancellation must be 600');

    // Cancelled event
    const res = await ledgerWorkerService.processPostback({
      partnerId: 'myntra',
      externalTransactionId: txId,
      rawStatus: 'cancelled',
      purchaseAmount: 1200,
      commissionAmount: 120,
      userId,
      currency: 'INR'
    });

    assert(res.success === true, 'Cancellation must succeed');
    assert(res.mappedStatus === 'CANCELLED', 'Mapped status must be CANCELLED');

    const walletAfter = ledgerWorkerService.getWallet(userId);
    assert(walletAfter?.pendingBalance === 0, `Pending balance must be deducted to 0 upon cancellation, got ${walletAfter?.pendingBalance}`);
    assert(walletAfter?.availableBalance === 0, 'Available balance must remain 0');
  });

  // Test 4: Refund Event
  await runTest('4. Refund Event', async () => {
    const userId = 'usr_test_delta';
    const txId = 'ord_test_refund_004';

    // Initial confirmed purchase
    await ledgerWorkerService.processPostback({
      partnerId: 'meesho',
      externalTransactionId: txId,
      rawStatus: 'delivered_reconciled',
      purchaseAmount: 800,
      commissionAmount: 80,
      userId,
      currency: 'INR'
    });

    const walletConfirmed = ledgerWorkerService.getWallet(userId);
    assert(walletConfirmed?.availableBalance === 400, 'Available balance must be 400 after delivery confirmation');

    // Subsequent return / refund event
    const res = await ledgerWorkerService.processPostback({
      partnerId: 'meesho',
      externalTransactionId: txId,
      rawStatus: 'rto',
      purchaseAmount: 800,
      commissionAmount: 80,
      userId,
      currency: 'INR'
    });

    assert(res.success === true, 'Refund processing must succeed');
    assert(res.mappedStatus === 'REFUNDED', 'Status must be REFUNDED');

    const walletRefunded = ledgerWorkerService.getWallet(userId);
    assert(walletRefunded?.availableBalance === 0, `Available balance must be reversed to 0 after refund, got ${walletRefunded?.availableBalance}`);
  });

  // Test 5: Rejection Event (Terminal State)
  await runTest('5. Rejection Event (Terminal State)', async () => {
    const userId = 'usr_test_epsilon';
    const txId = 'ord_test_reject_005';

    // Pending
    await ledgerWorkerService.processPostback({
      partnerId: 'amazon',
      externalTransactionId: txId,
      rawStatus: 'in_transit',
      purchaseAmount: 1000,
      commissionAmount: 100,
      userId,
      currency: 'INR'
    });

    // Rejection (ineligible or fraudulent)
    const res = await ledgerWorkerService.processPostback({
      partnerId: 'amazon',
      externalTransactionId: txId,
      rawStatus: 'rejected',
      purchaseAmount: 1000,
      commissionAmount: 100,
      userId,
      currency: 'INR'
    });

    assert(res.success === true, 'Rejection processing must succeed');
    assert(res.mappedStatus === 'REJECTED', 'Status must be REJECTED');

    const tx = ledgerWorkerService.getTransaction(`tx_amazon_${txId}`);
    assert(tx?.currentStatus === 'REJECTED', 'Transaction status must be REJECTED');
  });

  // Test 6: Duplicate Event Protection (Idempotency Key)
  await runTest('6. Duplicate Event Protection (Idempotency Key)', async () => {
    const userId = 'usr_test_zeta';
    const txId = 'ord_test_duplicate_006';
    const customKey = 'idem_key_unique_test_006';

    const req = {
      partnerId: 'flipkart',
      externalTransactionId: txId,
      rawStatus: 'completed',
      purchaseAmount: 2000,
      commissionAmount: 200,
      userId,
      currency: 'INR',
      idempotencyKey: customKey
    };

    // First invocation
    const firstRes = await ledgerWorkerService.processPostback(req);
    assert(firstRes.success === true, 'First invocation must succeed');
    assert(!firstRes.isDuplicate, 'First invocation must not be marked duplicate');

    const walletFirst = ledgerWorkerService.getWallet(userId);
    const balanceFirst = walletFirst?.availableBalance;

    // Second invocation (duplicate)
    const secondRes = await ledgerWorkerService.processPostback(req);
    assert(secondRes.success === true, 'Second invocation must succeed idempotently');
    assert(secondRes.isDuplicate === true, 'Second invocation must be marked duplicate');

    const walletSecond = ledgerWorkerService.getWallet(userId);
    assert(walletSecond?.availableBalance === balanceFirst, `Available balance must not be credited twice (expected ${balanceFirst}, got ${walletSecond?.availableBalance})`);
  });

  // Test 7: Replayed Event Protection
  await runTest('7. Replayed Event Protection', async () => {
    const userId = 'usr_test_eta';
    const txId = 'ord_test_replay_007';

    // Postback received and processed
    const initial = await ledgerWorkerService.processPostback({
      partnerId: 'meesho',
      externalTransactionId: txId,
      rawStatus: 'delivered_reconciled',
      purchaseAmount: 1000,
      commissionAmount: 100,
      userId,
      currency: 'INR'
    });
    assert(initial.success === true, 'Initial postback must succeed');

    const ledgersBefore = ledgerWorkerService.getLedgerEntriesForUser(userId);
    const countBefore = ledgersBefore.length;

    // Replay of same payload without custom idempotency key (computed deterministic key matches)
    const replay = await ledgerWorkerService.processPostback({
      partnerId: 'meesho',
      externalTransactionId: txId,
      rawStatus: 'delivered_reconciled',
      purchaseAmount: 1000,
      commissionAmount: 100,
      userId,
      currency: 'INR'
    });

    assert(replay.isDuplicate === true, 'Replay must be flagged as duplicate');
    const ledgersAfter = ledgerWorkerService.getLedgerEntriesForUser(userId);
    assert(ledgersAfter.length === countBefore, `No new ledger entry must be created on replay (expected ${countBefore}, got ${ledgersAfter.length})`);
  });

  // Test 8: Invalid Transition Prevention (REJECTED -> CONFIRMED, CANCELLED -> CONFIRMED)
  await runTest('8. Invalid Transition Prevention', async () => {
    const userId = 'usr_test_theta';
    const txId = 'ord_test_invalid_008';

    // 1. Establish rejected transaction
    await ledgerWorkerService.processPostback({
      partnerId: 'amazon',
      externalTransactionId: txId,
      rawStatus: 'rejected',
      purchaseAmount: 500,
      commissionAmount: 50,
      userId,
      currency: 'INR'
    });

    // 2. Attempt illegal transition to CONFIRMED
    const invalidRes = await ledgerWorkerService.processPostback({
      partnerId: 'amazon',
      externalTransactionId: txId,
      rawStatus: 'delivered_return_expired', // maps to CONFIRMED
      purchaseAmount: 500,
      commissionAmount: 50,
      userId,
      currency: 'INR'
    });

    assert(invalidRes.success === false, 'Transition from REJECTED to CONFIRMED must fail');
    assert(invalidRes.error !== undefined && invalidRes.error.includes('Terminal'), 'Error must specify terminal state prohibition');

    const tx = ledgerWorkerService.getTransaction(`tx_amazon_${txId}`);
    assert(tx?.currentStatus === 'REJECTED', 'Transaction status must remain REJECTED');
  });

  // Test 9: Forged Client Balance Protection
  await runTest('9. Forged Client Balance Protection', async () => {
    const userId = 'usr_test_iota';
    const txId = 'ord_test_forged_balance_009';

    // Attempting to send client-injected balance or point fields in payload
    const maliciousPayload: any = {
      partnerId: 'flipkart',
      externalTransactionId: txId,
      rawStatus: 'completed',
      purchaseAmount: 1000,
      commissionAmount: 100,
      userId,
      currency: 'INR',
      // Forged client claims:
      clientAvailableBalance: 999999,
      clientPoints: 50000,
      walletBalance: 100000
    };

    const res = await ledgerWorkerService.processPostback(maliciousPayload);
    assert(res.success === true, 'Worker should process valid order fields');

    const wallet = ledgerWorkerService.getWallet(userId);
    // Calculated: 100 INR commission * 50% user share = 50 INR * 10 pts = 500 PTS
    assert(wallet?.availableBalance === 500, `Wallet balance must equal authoritative 500 PTS, not forged value (got ${wallet?.availableBalance})`);
  });

  // Test 10: Forged Reward Amount Protection
  await runTest('10. Forged Reward Amount Protection', async () => {
    const userId = 'usr_test_kappa';
    const txId = 'ord_test_forged_amount_010';

    const maliciousPayload: any = {
      partnerId: 'myntra',
      externalTransactionId: txId,
      rawStatus: 'delivered_reconciled',
      purchaseAmount: 1000,
      commissionAmount: 100,
      userId,
      currency: 'INR',
      // Attacker claims huge points
      userRewardPoints: 500000,
      grossCommission: 999999
    };

    const res = await ledgerWorkerService.processPostback(maliciousPayload);
    assert(res.success === true, 'Worker should process');

    // Server authoritative points for 100 INR commission = 500 PTS
    assert(res.userRewardPoints === 500, `Server must override forged points (expected 500, got ${res.userRewardPoints})`);
  });

  // Test 11: Concurrent Processing Protection
  await runTest('11. Concurrent Processing Protection', async () => {
    const userId = 'usr_test_lambda';
    const txId = 'ord_test_concurrent_011';

    // Send 5 concurrent requests for same transaction
    const requests = Array.from({ length: 5 }).map((_, i) =>
      ledgerWorkerService.processPostback({
        partnerId: 'meesho',
        externalTransactionId: txId,
        rawStatus: 'in_transit',
        purchaseAmount: 1000,
        commissionAmount: 100,
        userId,
        currency: 'INR',
        idempotencyKey: `concurrent_key_${i}` // distinct idempotency key, same transaction
      })
    );

    const responses = await Promise.all(requests);
    assert(responses.every((r) => r.success), 'All concurrent calls must complete cleanly');

    const wallet = ledgerWorkerService.getWallet(userId);
    // Only one pending allocation should apply (same state PENDING is an idempotent confirmation)
    assert(wallet?.pendingBalance === 500, `Concurrent requests must not inflate pending balance (expected 500, got ${wallet?.pendingBalance})`);
  });

  // Test 12: Retry After Failure
  await runTest('12. Retry After Failure', async () => {
    const userId = 'usr_test_mu';
    const eventId = 'evt_test_failed_retry_012';
    const idempotencyKey = 'idem_key_retry_012';

    // Step 1: Force a failed event by passing an illegal state transition directly into service
    const failedRes = await ledgerWorkerService.processPostback({
      partnerId: 'amazon',
      externalTransactionId: 'ord_test_retry_012',
      rawStatus: 'cancelled', // initially cancelled
      purchaseAmount: 500,
      commissionAmount: 50,
      userId,
      idempotencyKey
    });
    assert(failedRes.success === true, 'Cancellation succeeded');

    // Now send illegal transition to generate a rejected event
    const rejectedAttempt = await ledgerWorkerService.processPostback({
      partnerId: 'amazon',
      externalTransactionId: 'ord_test_retry_012',
      rawStatus: 'completed', // illegal after cancelled
      purchaseAmount: 500,
      commissionAmount: 50,
      userId,
      idempotencyKey: 'idem_key_retry_illegal'
    });
    assert(rejectedAttempt.success === false, 'Illegal transition recorded as rejected');

    const rejectedEventId = rejectedAttempt.eventId;
    assert(Boolean(rejectedEventId), 'Event ID must exist for rejected event');

    // Step 2: Test retry of recorded event
    const retryRes = await ledgerWorkerService.retryFailedPostback(rejectedEventId);
    assert(retryRes.transactionId !== undefined, 'Retry executed cleanly without throwing');
  });

  // --- Print Summary ---
  console.log('\n================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`TEST RUN COMPLETE: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

export const runLedgerWorkerTestSuite = executeAllTests;

if (process.argv[1]?.endsWith('testLedgerWorker.ts') || process.argv[1]?.endsWith('testLedgerWorker.js')) {
  executeAllTests().catch((e) => {
    console.error('Test suite runner crashed:', e);
    process.exit(1);
  });
}
