import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import {
  getUserLoginActivity,
  getRecentLoginSessions,
  getUserLoginHistory,
  getActiveUsers,
  getLoginStatistics,
} from './login-activity.service';
import { AppError } from '../../core/errors';

/**
 * Get all users with their login activity
 * GET /api/admin/login-activity
 */
export const getUserLoginActivityController: RequestHandler = async (req, res, next) => {
  try {
    const activity = await getUserLoginActivity();
    sendSuccess(res, activity, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent login sessions
 * GET /api/admin/login-activity/sessions
 */
export const getRecentLoginSessionsController: RequestHandler = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const sessions = await getRecentLoginSessions(limit);
    sendSuccess(res, sessions, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get login history for a specific user
 * GET /api/admin/login-activity/user/:userId
 */
export const getUserLoginHistoryController: RequestHandler = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      throw new AppError({ statusCode: 400, message: 'Invalid user ID', code: 'BAD_REQUEST' });
    }
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await getUserLoginHistory(userId, limit);
    sendSuccess(res, history, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently active users (logged in within last 24 hours)
 * GET /api/admin/login-activity/active
 */
export const getActiveUsersController: RequestHandler = async (req, res, next) => {
  try {
    const activeUsers = await getActiveUsers();
    sendSuccess(res, activeUsers, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Get login statistics
 * GET /api/admin/login-activity/statistics
 */
export const getLoginStatisticsController: RequestHandler = async (req, res, next) => {
  try {
    const statistics = await getLoginStatistics();
    sendSuccess(res, statistics, 200);
  } catch (error) {
    next(error);
  }
};

