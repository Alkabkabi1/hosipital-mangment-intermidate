/**
 * Housing Allowance Request (بدل سكن أطباء سعوديين) - Routes
 */

import { Router } from 'express';
import { authenticate as authenticateToken } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import { createHousingAllowanceSchema, updateHousingAllowanceStatusSchema } from './housing-allowance.schema';
import { validateBody as validateSchema } from '../../validation/validate';
import {
  createHousingAllowanceRequestController,
  getAllHousingAllowanceRequestsController,
  getHousingAllowanceRequestByIdController,
  getMyHousingAllowanceRequestsController,
  updateHousingAllowanceRequestStatusController
} from './housing-allowance.controller';

const router = Router();

// Employee routes
router.post(
  '/',
  authenticateToken,
  validateSchema(createHousingAllowanceSchema),
  createHousingAllowanceRequestController
);

router.get(
  '/my-requests',
  authenticateToken,
  getMyHousingAllowanceRequestsController
);

// Alias for compatibility with frontend
router.get(
  '/mine',
  authenticateToken,
  getMyHousingAllowanceRequestsController
);

// Admin routes
router.get(
  '/',
  authenticateToken,
  requireRoles(['ADMIN', 'HR', 'FINANCE']),
  getAllHousingAllowanceRequestsController
);

router.get(
  '/:id',
  authenticateToken,
  requireRoles(['ADMIN', 'HR', 'FINANCE']),
  getHousingAllowanceRequestByIdController
);

router.patch(
  '/:id/status',
  authenticateToken,
  requireRoles(['ADMIN', 'HR', 'FINANCE']),
  validateSchema(updateHousingAllowanceStatusSchema),
  updateHousingAllowanceRequestStatusController
);

export { router as housingAllowanceRouter };
