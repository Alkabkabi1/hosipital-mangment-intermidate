/**
 * Maternity Leave Request (طلب إجازة رعاية مولود) - Routes
 */

import { Router } from 'express';
import { authenticate as authenticateToken } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import { createMaternityLeaveSchema, updateMaternityLeaveStatusSchema } from './maternity-leave.schema';
import { validateBody as validateSchema } from '../../validation/validate';
import {
  createMaternityLeaveRequestController,
  getAllMaternityLeaveRequestsController,
  getMaternityLeaveRequestByIdController,
  getMyMaternityLeaveRequestsController,
  updateMaternityLeaveRequestStatusController
} from './maternity-leave.controller';

const router = Router();

// Employee routes
router.post(
  '/',
  authenticateToken,
  validateSchema(createMaternityLeaveSchema),
  createMaternityLeaveRequestController
);

router.get(
  '/my-requests',
  authenticateToken,
  getMyMaternityLeaveRequestsController
);

// Alias for compatibility with frontend
router.get(
  '/mine',
  authenticateToken,
  getMyMaternityLeaveRequestsController
);

// Admin routes
router.get(
  '/',
  authenticateToken,
  requireRoles(['ADMIN', 'HR']),
  getAllMaternityLeaveRequestsController
);

router.get(
  '/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'HR']),
  getMaternityLeaveRequestByIdController
);

router.patch(
  '/:id/status',
  authenticateToken,
  requireRoles(['ADMIN', 'HR']),
  validateSchema(updateMaternityLeaveStatusSchema),
  updateMaternityLeaveRequestStatusController
);

export { router as maternityLeaveRouter };
