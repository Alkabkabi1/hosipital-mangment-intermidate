import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import { validateBody } from '../../validation/validate';
import { createRewardRefundSchema, updateRewardRefundStatusSchema } from './reward-refund.schema';
import * as controller from './reward-refund.controller';

export const rewardRefundRouter = Router();

// Employee routes
rewardRefundRouter.post(
  '/',
  authenticate,
  validateBody(createRewardRefundSchema),
  controller.createRewardRefundController
);

rewardRefundRouter.get(
  '/:id',
  authenticate,
  controller.getRewardRefundByIdController
);

// Admin routes
rewardRefundRouter.get(
  '/admin/all',
  authenticate,
  requireRoles(['ADMIN', 'HR', 'MANAGER']),
  controller.getAllRewardRefundsController
);

rewardRefundRouter.put(
  '/:id/status',
  authenticate,
  requireRoles(['ADMIN', 'HR', 'MANAGER']),
  validateBody(updateRewardRefundStatusSchema),
  controller.updateRewardRefundStatusController
);

// Employee-specific router
export const employeeRewardRefundRouter = Router();
employeeRewardRefundRouter.get(
  '/',
  authenticate,
  controller.getMyRewardRefundsController
);

