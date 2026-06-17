import { Router } from 'express';
import {
  createClearanceController,
  createOnboardingController,
  createDelegationController,
  getMyRequestsController,
  getMyClearancesController,
  getMyOnboardingsController,
  getMyClearancesController as getMyCertificatesController,
  getMyClearancesController as getMyExperiencesController,
  getEmployeeSummaryController,
  getAdminRecentPendingController,
  getAdminSummaryController,
  approveRequestController,
  rejectRequestController,
  getMyOnboardingsController as getOnboardingDetailController,
  getMyClearancesController as getClearanceDetailController
} from './employee-requests.controller';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import { rateLimit } from '../../middleware/rateLimit';
import { validateBody } from '../../validation/validate';
import { Schemas } from '../../validation/schemas';

// Import employee-specific routers
import { employeeAssignmentRouter } from '../assignment/assignment.routes';
import { employeeAssignmentTerminationRouter } from '../assignment-termination/assignment-termination.routes';
import { employeeInternalTransferRouter } from '../internal-transfer/internal-transfer.routes';
import { getUserExitsController } from '../exit/exit.controller';
import { employeeTravelOrderRouter } from '../travel-order/travel-order.routes';
import { employeeRewardRefundRouter } from '../reward-refund/reward-refund.routes';
import { employeeAirlinesTicketRouter } from '../airlines-ticket/airlines-ticket.routes';

export const employeeRequestsRouter = Router();

// Employee routes (protected by authentication)
employeeRequestsRouter.use(authenticate);

// Employee endpoints - creating requests
employeeRequestsRouter.post(
  '/employee/requests/clearance',
  rateLimit({ windowMs: 60_000, max: 120 }),
  validateBody(Schemas.clearance.create),
  createClearanceController
);
employeeRequestsRouter.post(
  '/employee/requests/onboarding',
  rateLimit({ windowMs: 60_000, max: 120 }),
  validateBody(Schemas.onboarding.create),
  createOnboardingController
);
employeeRequestsRouter.post(
  '/employee/requests/delegation',
  rateLimit({ windowMs: 60_000, max: 120 }),
  validateBody(Schemas.delegation.create),
  createDelegationController
);

// Employee endpoints - reading own requests
employeeRequestsRouter.get('/employee/requests', getMyRequestsController);
employeeRequestsRouter.get('/employee/requests/summary', authenticate, getEmployeeSummaryController);
employeeRequestsRouter.get('/employee/clearances', getMyClearancesController);
employeeRequestsRouter.get('/employee/onboardings', getMyOnboardingsController);
employeeRequestsRouter.get('/employee/onboardings/:id', getOnboardingDetailController);
employeeRequestsRouter.get('/employee/clearances/:id', getClearanceDetailController);
employeeRequestsRouter.get('/employee/certificates', getMyCertificatesController);
employeeRequestsRouter.get('/employee/experiences', getMyExperiencesController);
employeeRequestsRouter.get('/employee/exits', getUserExitsController);

// Mount employee-specific request routers
employeeRequestsRouter.use('/employee/assignments', employeeAssignmentRouter);
employeeRequestsRouter.use('/employee/assignment-terminations', employeeAssignmentTerminationRouter);
employeeRequestsRouter.use('/employee/internal-transfers', employeeInternalTransferRouter);
employeeRequestsRouter.use('/employee/travel-orders', employeeTravelOrderRouter);
employeeRequestsRouter.use('/employee/reward-refunds', employeeRewardRefundRouter);
employeeRequestsRouter.use('/employee/airlines-tickets', employeeAirlinesTicketRouter);

// Admin endpoints (require admin role)
employeeRequestsRouter.get('/admin/requests/recent', requireRoles(['ADMIN']), getAdminRecentPendingController);
employeeRequestsRouter.get('/admin/requests/summary', requireRoles(['ADMIN']), getAdminSummaryController);
employeeRequestsRouter.post('/admin/requests/:type/:id/approve', rateLimit({ windowMs: 60_000, max: 120 }), requireRoles(['ADMIN']), approveRequestController);
employeeRequestsRouter.post('/admin/requests/:type/:id/reject', rateLimit({ windowMs: 60_000, max: 120 }), requireRoles(['ADMIN']), rejectRequestController);