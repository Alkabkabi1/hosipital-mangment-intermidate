import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import {
  getUserLoginActivityController,
  getRecentLoginSessionsController,
  getUserLoginHistoryController,
  getActiveUsersController,
  getLoginStatisticsController,
} from './login-activity.controller';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireRoles(['ADMIN']));

// Get all users with login activity
router.get('/', getUserLoginActivityController);

// Get recent login sessions
router.get('/sessions', getRecentLoginSessionsController);

// Get currently active users
router.get('/active', getActiveUsersController);

// Get login statistics
router.get('/statistics', getLoginStatisticsController);

// Get login history for specific user
router.get('/user/:userId', getUserLoginHistoryController);

export default router;

