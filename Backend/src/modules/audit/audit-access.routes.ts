import { Router } from 'express';

import { requireRoles } from '../../core/middleware/requireRoles';
import { rateLimit } from '../../middleware/rateLimit';
import {
  getAccessAuditSummaryController,
  getDeniedAccessController,
  getExcessiveDenialsController,
  getPopularEndpointsController,
  getUserAuditHistoryController,
  getCurrentUserAuditHistoryController,
} from './audit-access.controller';

const auditAccessRouter = Router();

// User routes - get own audit history
auditAccessRouter.get(
  '/me/history',
  rateLimit({ windowMs: 60_000, max: 30 }),
  getCurrentUserAuditHistoryController
);

// Admin routes - view all audit data
auditAccessRouter.get(
  '/access-summary',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 60 }),
  getAccessAuditSummaryController
);

auditAccessRouter.get(
  '/denied-access',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 60 }),
  getDeniedAccessController
);

auditAccessRouter.get(
  '/excessive-denials',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 60 }),
  getExcessiveDenialsController
);

auditAccessRouter.get(
  '/popular-endpoints',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 60 }),
  getPopularEndpointsController
);

auditAccessRouter.get(
  '/user/:userId/history',
  requireRoles(['ADMIN']),
  rateLimit({ windowMs: 60_000, max: 60 }),
  getUserAuditHistoryController
);

export { auditAccessRouter };

