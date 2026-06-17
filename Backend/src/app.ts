import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import rateLimit from 'express-rate-limit';

import { env, isProduction } from './config';
import { errorHandler } from './core/middleware/errorHandler';
import { notFoundHandler } from './core/middleware/notFoundHandler';
import { requestLogger } from './core/middleware/requestLogger';
import { apiRouter } from './routes';
import { createCorsMiddleware } from './middleware/cors';
import { securityHeaders } from './middleware/securityHeaders';
import { applyHttpsEnforcement } from './middleware/enforceHttps';
import { METRICS_ENABLED, metricsMiddleware, metricsRouter } from './middleware/metrics';
import { profilerRouter } from './middleware/profiler';
import { assertDatabaseConnection } from './core/database';

// CORS options moved to dedicated middleware

function registerFrontend(app: express.Express) {
  const distDir = path.resolve(__dirname);
  const projectRoot = path.resolve(distDir, '..', '..');
  const frontendRoot = path.join(projectRoot, 'Frontend');

  const htmlRoot = path.join(frontendRoot, 'HTML');
  const cssRoot = path.join(frontendRoot, 'CSS');
  const jsRoot = path.join(frontendRoot, 'jS');

  if (!fs.existsSync(htmlRoot)) {
    return;
  }

  if (fs.existsSync(cssRoot)) {
    app.use('/Frontend/CSS', express.static(cssRoot));
  }

  if (fs.existsSync(jsRoot)) {
    app.use('/Frontend/jS', express.static(jsRoot));
  }

  app.use('/Frontend/HTML', express.static(htmlRoot, { index: false }));
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // HTTPS enforcement (behind proxy in production)
  applyHttpsEnforcement(app);

  // CORS (least-privilege) – must be before routes
  app.use(createCorsMiddleware());

  // Security headers & CSP – after CORS
  for (const mw of securityHeaders()) app.use(mw);

  // Metrics middleware (optional)
  if (METRICS_ENABLED) {
    app.use(metricsMiddleware);
  }

  // Dev/staging profiler (never in production)
  if (process.env.NODE_ENV !== 'production' && process.env.PROFILER_ENABLED === 'true') {
    app.use(profilerRouter);
  }
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // ---- PUBLIC health & readiness (no auth, no rate-limit) ----
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/api/ready', async (_req, res) => {
    try {
      await assertDatabaseConnection();
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'unready', reason: 'db_unreachable' });
    }
  });
  // ------------------------------------------------------------

  registerFrontend(app);

  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
  if (!env.DEV_EASY) {
    app.use('/api', limiter);
  }

  // Expose metrics endpoint (no auth, scrape-only)
  if (METRICS_ENABLED) {
    app.use('/metrics', metricsRouter);
  }

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
