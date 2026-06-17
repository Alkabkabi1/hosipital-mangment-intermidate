import type { RequestHandler } from 'express';

import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../core/errors';
import {
  getUnreadNotifications,
  getUserNotifications,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
} from './role-notification.service';

/**
 * GET /api/notifications/unread
 * Get unread notifications for the current user
 */
export const getUnreadNotificationsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const notifications = await getUnreadNotifications(userId);
    sendSuccess(res, { notifications, count: notifications.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications
 * Get all notifications for the current user (paginated)
 */
export const getUserNotificationsController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    if (limit < 1 || limit > 100) {
      throw new AppError({ statusCode: 400, message: 'Limit must be between 1 and 100', code: 'VALIDATION_ERROR' });
    }

    const notifications = await getUserNotifications(userId, limit, offset);
    sendSuccess(res, { notifications, count: notifications.length, limit, offset });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/mark-read
 * Mark specific notifications as read
 */
export const markNotificationsReadController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new AppError({
        statusCode: 400,
        message: 'notificationIds array is required',
        code: 'VALIDATION_ERROR',
      });
    }

    await markNotificationsAsRead(notificationIds, userId);
    sendSuccess(res, { message: 'Notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
export const markAllNotificationsReadController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) {
      throw new AppError({ statusCode: 401, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    await markAllNotificationsAsRead(userId);
    sendSuccess(res, { message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

