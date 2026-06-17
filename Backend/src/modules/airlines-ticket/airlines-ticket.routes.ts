import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import { validateBody } from '../../validation/validate';
import { createAirlinesTicketSchema, updateAirlinesTicketStatusSchema } from './airlines-ticket.schema';
import * as controller from './airlines-ticket.controller';

export const airlinesTicketRouter = Router();

// Employee routes
airlinesTicketRouter.post(
  '/',
  authenticate,
  validateBody(createAirlinesTicketSchema),
  controller.createAirlinesTicketController
);

airlinesTicketRouter.get(
  '/:id',
  authenticate,
  controller.getAirlinesTicketByIdController
);

// Admin routes
airlinesTicketRouter.get(
  '/admin/all',
  authenticate,
  requireRoles(['ADMIN', 'HR', 'MANAGER']),
  controller.getAllAirlinesTicketsController
);

airlinesTicketRouter.put(
  '/:id/status',
  authenticate,
  requireRoles(['ADMIN', 'HR', 'MANAGER']),
  validateBody(updateAirlinesTicketStatusSchema),
  controller.updateAirlinesTicketStatusController
);

// Employee-specific router
export const employeeAirlinesTicketRouter = Router();
employeeAirlinesTicketRouter.get(
  '/',
  authenticate,
  controller.getMyAirlinesTicketsController
);

