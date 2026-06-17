import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as controller from './assignment.controller';

export const assignmentRouter = Router();

// Create assignment request (employee)
assignmentRouter.post('/', authenticate, controller.createAssignmentController);

// Get assignment by ID
assignmentRouter.get('/:id', authenticate, controller.getAssignmentByIdController);

// Update assignment status (admin only)
assignmentRouter.put('/:id/status', authenticate, requireRoles(['ADMIN', 'HR', 'MANAGER']), controller.updateAssignmentStatusController);

// Get user's assignments (employee endpoint under /employee)
export const employeeAssignmentRouter = Router();
employeeAssignmentRouter.get('/', authenticate, controller.getMyAssignmentsController);

// Get all assignments (admin only)
export const adminAssignmentRouter = Router();
adminAssignmentRouter.get('/', authenticate, requireRoles(['ADMIN', 'HR', 'MANAGER']), controller.getAllAssignmentsController);

