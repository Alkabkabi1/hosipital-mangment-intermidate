import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import { validateBody } from '../../validation/validate';
import { createTravelOrderSchema, updateTravelOrderStatusSchema } from './travel-order.schema';
import * as controller from './travel-order.controller';

export const travelOrderRouter = Router();

// Employee routes
travelOrderRouter.post(
  '/',
  authenticate,
  validateBody(createTravelOrderSchema),
  controller.createTravelOrderController
);

travelOrderRouter.get(
  '/:id',
  authenticate,
  controller.getTravelOrderByIdController
);

// Admin routes
travelOrderRouter.get(
  '/admin/all',
  authenticate,
  requireRoles(['ADMIN', 'HR', 'MANAGER']),
  controller.getAllTravelOrdersController
);

travelOrderRouter.put(
  '/:id/status',
  authenticate,
  requireRoles(['ADMIN', 'HR', 'MANAGER']),
  validateBody(updateTravelOrderStatusSchema),
  controller.updateTravelOrderStatusController
);

// Employee-specific router
export const employeeTravelOrderRouter = Router();
employeeTravelOrderRouter.get(
  '/',
  authenticate,
  controller.getMyTravelOrdersController
);

