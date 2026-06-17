import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as leaveController from './leave.controller';

const router = Router();

// Employee routes (authenticated users)
router.post('/', authenticate, leaveController.createLeaveRequestController);
router.get('/mine', authenticate, leaveController.getMyLeaveRequestsController);
router.get('/:id', authenticate, leaveController.getLeaveRequestByIdController);
router.delete('/:id', authenticate, leaveController.deleteLeaveRequestController);

// Admin routes (HR, ADMIN, MANAGER)
router.get('/', authenticate, requireRoles(['ADMIN', 'HR', 'MANAGER']), leaveController.getAllLeaveRequestsController);
router.put('/:id/approve', authenticate, requireRoles(['ADMIN', 'HR', 'MANAGER']), leaveController.approveLeaveRequestController);
router.put('/:id/reject', authenticate, requireRoles(['ADMIN', 'HR', 'MANAGER']), leaveController.rejectLeaveRequestController);
router.put('/:id/status', authenticate, requireRoles(['ADMIN', 'HR', 'MANAGER']), leaveController.updateLeaveRequestStatusController);

// Comments routes (authenticated users)
router.post('/:id/comments', authenticate, leaveController.addLeaveRequestCommentController);
router.get('/:id/comments', authenticate, leaveController.getLeaveRequestCommentsController);

// History route (authenticated users)
router.get('/:id/history', authenticate, leaveController.getLeaveRequestHistoryController);

export default router;

