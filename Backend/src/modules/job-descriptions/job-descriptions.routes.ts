import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as jobDescController from './job-descriptions.controller';

const router = Router();

// ====================== Employee Routes ======================
// These will be mounted at /employee/job-descriptions
router.post('/job-descriptions', authenticate, jobDescController.createJobDescriptionController);
router.get('/job-descriptions', authenticate, jobDescController.getMyJobDescriptionsController);
router.get('/job-descriptions/approved', authenticate, jobDescController.getMyApprovedJobDescriptionController);
router.delete('/job-descriptions/:id', authenticate, jobDescController.deleteJobDescriptionController);

export default router;

