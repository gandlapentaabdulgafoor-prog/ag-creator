import express from 'express';
import { terminate } from 'firebase/firestore';
import { db } from '../../src/firebase.js';
import { affiliateServerRouter } from '../affiliateRoutes.js';
import { adminServerRouter } from '../adminRoutes.js';
import { complianceServerRouter } from '../kycWithdrawalRoutes.js';
import { creatorServerRouter } from '../creatorRoutes.js';
import { runLedgerWorkerTestSuite } from '../testLedgerWorker.js';

async function runSuites() {
  const app = express();
  app.use(express.json());
  app.use('/api/creator', creatorServerRouter);
  app.use('/api/affiliate', affiliateServerRouter);
  app.use('/api/admin', adminServerRouter);
  app.use('/api/compliance', complianceServerRouter);
  app.get('/api/health', (_req, res) => res.json({
    status: 'ok',
    service: 'ONEAG Server',
    timestamp: new Date().toISOString(),
  }));

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.once('error', reject);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not start the test API server.');
  process.env.TEST_SERVER_URL = `http://127.0.0.1:${address.port}`;

  try {
    const creatorStatusResponse = await fetch(`${process.env.TEST_SERVER_URL}/api/creator/status`);
    const creatorStatus = await creatorStatusResponse.json() as { provider?: string; configured?: unknown };
    if (!creatorStatusResponse.ok || creatorStatus.provider !== 'Gemini' || typeof creatorStatus.configured !== 'boolean') {
      throw new Error('AG Creator provider status must report provider readiness without exposing credentials.');
    }
    const unauthenticatedGeneration = await fetch(`${process.env.TEST_SERVER_URL}/api/creator/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow: 'seo', input: 'A product launch' }),
    });
    const expectedUnauthenticatedStatus = creatorStatus.configured ? 401 : 503;
    if (unauthenticatedGeneration.status !== expectedUnauthenticatedStatus) {
      throw new Error(`AG Creator unavailable/auth response mismatch: expected ${expectedUnauthenticatedStatus}, got ${unauthenticatedGeneration.status}.`);
    }
    if (!creatorStatus.configured) {
      const unavailablePayload = await unauthenticatedGeneration.json() as { error?: string };
      if (!unavailablePayload.error?.includes('GEMINI_API_KEY')) {
        throw new Error('AG Creator should clearly identify the missing GEMINI_API_KEY server setting.');
      }
    }

    await runLedgerWorkerTestSuite();
    const { runPhase5TestSuite } = await import('./phase5Regression.js');
    const { runPhase8TestSuite } = await import('./phase8Compliance.js');
    const { runFinalSecurityTestSuite } = await import('./finalSecurityHardening.js');
    await runPhase5TestSuite();
    await runPhase8TestSuite();
    await runFinalSecurityTestSuite();
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await terminate(db);
  }
}

runSuites().catch((error) => {
  console.error('Test suite runner crashed:', error);
  process.exitCode = 1;
});
