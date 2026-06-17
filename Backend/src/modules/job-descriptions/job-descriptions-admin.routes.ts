import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as jobDescController from './job-descriptions.controller';

const router = Router();

// ====================== Admin Routes ======================
// These will be mounted at /admin
router.get('/job-descriptions/pending', authenticate, requireRoles(['ADMIN', 'HR']), jobDescController.getPendingJobDescriptionsController);
router.get('/job-descriptions', authenticate, requireRoles(['ADMIN', 'HR']), jobDescController.getAllJobDescriptionsController);
router.post('/job-descriptions/:id/approve', authenticate, requireRoles(['ADMIN', 'HR']), jobDescController.approveJobDescriptionController);
router.post('/job-descriptions/:id/reject', authenticate, requireRoles(['ADMIN', 'HR']), jobDescController.rejectJobDescriptionController);

// Admin view specific employee's approved job description
router.get('/employees/:employeeId/job-description', authenticate, requireRoles(['ADMIN', 'HR']), jobDescController.getEmployeeJobDescriptionController);

export default router;

