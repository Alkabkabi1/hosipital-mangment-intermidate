import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as controller from './assignment-termination.controller';

export const assignmentTerminationRouter = Router();

assignmentTerminationRouter.post('/', authenticate, controller.createAssignmentTerminationController);
assignmentTerminationRouter.get('/:id', authenticate, controller.getAssignmentTerminationByIdController);
assignmentTerminationRouter.put('/:id/status', authenticate, requireRoles(['ADMIN', 'HR', 'MANAGER']), controller.updateAssignmentTerminationStatusController);

export const employeeAssignmentTerminationRouter = Router();
employeeAssignmentTerminationRouter.get('/', authenticate, controller.getMyAssignmentTerminationsController);

export const adminAssignmentTerminationRouter = Router();
adminAssignmentTerminationRouter.get('/', authenticate, requireRoles(['ADMIN', 'HR', 'MANAGER']), controller.getAllAssignmentTerminationsController);

