import type { RequestHandler } from 'express';

import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import {
  getAccessAuditSummary,
  getDeniedAccessAttempts,
  getUsersWithExcessiveDenials,
  getMostAccessedEndpoints,
  getUserAuditHistory,
} from './access-audit.service';

/**
 * GET /api/admin/audit/access-summary
 * Get access audit summary (admin only)
 */
export const getAccessAuditSummaryController: RequestHandler = async (req, res, next) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;

    const summary = await getAccessAuditSummary(startDate, endDate, userId);
    sendSuccess(res, { summary, count: summary.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/audit/denied-access
 * Get denied access attempts (admin only)
 */
export const getDeniedAccessController: RequestHandler = async (req, res, next) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;

    const denials = await getDeniedAccessAttempts(startDate, endDate, userId);
    sendSuccess(res, { denials, count: denials.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/audit/excessive-denials
 * Get users with excessive access denials (admin only)
 */
export const getExcessiveDenialsController: RequestHandler = async (req, res, next) => {
  try {
    const threshold = req.query.threshold ? parseInt(req.query.threshold as string, 10) : 10;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;

    const users = await getUsersWithExcessiveDenials(threshold, days);
    sendSuccess(res, { users, count: users.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/audit/popular-endpoints
 * Get most accessed endpoints (admin only)
 */
export const getPopularEndpointsController: RequestHandler = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const endpoints = await getMostAccessedEndpoints(limit);
    sendSuccess(res, { endpoints, count: endpoints.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/audit/user/:userId/history
 * Get detailed audit history for a specific user (admin only)
 */
export const getUserAuditHistoryController: RequestHandler = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid user ID', code: 'VALIDATION_ERROR' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const history = await getUserAuditHistory(userId, limit, offset);
    sendSuccess(res, { history, count: history.length, limit, offset });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/audit-history
 * Get current user's audit history
 */
export const getCurrentUserAuditHistoryController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const history = await getUserAuditHistory(userId, limit, offset);
    sendSuccess(res, { history, count: history.length, limit, offset });
  } catch (error) {
    next(error);
  }
};

