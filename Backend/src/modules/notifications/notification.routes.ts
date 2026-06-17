import { Router } from 'express';

import { authenticate } from '../../core/middleware/authenticate';
import { rateLimit } from '../../middleware/rateLimit';
import {
  getUnreadNotificationsController,
  getUserNotificationsController,
  markNotificationsReadController,
  markAllNotificationsReadController,
} from './notification.controller';

const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(authenticate);

// Get unread notifications
notificationRouter.get(
  '/unread',
  rateLimit({ windowMs: 60_000, max: 60 }),
  getUnreadNotificationsController
);

// Get all notifications (paginated)
notificationRouter.get(
  '/',
  rateLimit({ windowMs: 60_000, max: 60 }),
  getUserNotificationsController
);

// Mark specific notifications as read
notificationRouter.post(
  '/mark-read',
  rateLimit({ windowMs: 60_000, max: 60 }),
  markNotificationsReadController
);

// Mark all notifications as read
notificationRouter.post(
  '/mark-all-read',
  rateLimit({ windowMs: 60_000, max: 60 }),
  markAllNotificationsReadController
);

export { notificationRouter };

