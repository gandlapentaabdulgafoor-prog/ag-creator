import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { affiliateServerRouter } from './server/affiliateRoutes.js';
import { adminServerRouter } from './server/adminRoutes.js';
import { complianceServerRouter } from './server/kycWithdrawalRoutes.js';
import { creatorServerRouter } from './server/creatorRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON Body parsing
  app.use(express.json());

  // Authenticated AI creator endpoints; provider credentials remain server-side.
  app.use('/api/creator', creatorServerRouter);

  // Mount Secure Server-Side Affiliate Configuration & Webhook Routes
  app.use('/api/affiliate', affiliateServerRouter);

  // Mount Server-Authoritative Admin Governance Routes (Protected)
  app.use('/api/admin', adminServerRouter);

  // Mount KYC Compliance & Withdrawal Safeguard Routes
  app.use('/api/compliance', complianceServerRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'ONEAG Server',
      timestamp: new Date().toISOString()
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Mount Vite middlewares in development
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'vite.config.mjs'),
      configLoader: 'native',
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ONEAG Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
