/**
 * Exit Request (طلب إنهاء العمل) - Routes
 */

import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import {
  createExitController,
  getUserExitsController,
  getExitByIdController,
  getAllExitsController,
  updateExitStatusController,
  getExitHistoryController,
} from './exit.controller';

export const exitRouter = Router();

// All routes require authentication
exitRouter.use(authenticate);

// Employee routes
exitRouter.post('/', createExitController);
exitRouter.get('/', getUserExitsController);
exitRouter.get('/:id', getExitByIdController);
exitRouter.get('/:id/history', getExitHistoryController);

// Admin routes
exitRouter.get('/admin/all', requireRoles(['ADMIN']), getAllExitsController);
exitRouter.put('/:id/status', requireRoles(['ADMIN']), updateExitStatusController);

