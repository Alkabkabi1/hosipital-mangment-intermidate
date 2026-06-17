import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as controller from './internal-transfer.controller';

export const internalTransferRouter = Router();

internalTransferRouter.post('/', authenticate, controller.createInternalTransferController);
internalTransferRouter.get('/:id', authenticate, controller.getInternalTransferByIdController);
internalTransferRouter.put('/:id/status', authenticate, requireRoles(['ADMIN', 'HR', 'MANAGER']), controller.updateInternalTransferStatusController);

export const employeeInternalTransferRouter = Router();
employeeInternalTransferRouter.get('/', authenticate, controller.getMyInternalTransfersController);

export const adminInternalTransferRouter = Router();
adminInternalTransferRouter.get('/', authenticate, requireRoles(['ADMIN', 'HR', 'MANAGER']), controller.getAllInternalTransfersController);

