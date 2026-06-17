/**
 * Experience Certificate Request (شهادة خبرة) - Routes
 */

import { Router } from 'express';
import { authenticate as requireAuth } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as controller from './experience.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * Create a new experience certificate request
 * POST /api/experience-certificate
 * Access: Any authenticated user
 */
router.post('/', controller.createExperienceController);

/**
 * Get user's experience certificate requests
 * GET /api/experience-certificate
 * Access: Any authenticated user (returns their own)
 */
router.get('/', controller.getUserExperiencesController);

/**
 * Get experience certificate by ID
 * GET /api/experience-certificate/:id
 * Access: Owner or Admin/HR
 */
router.get('/:id', controller.getExperienceByIdController);

/**
 * Get experience certificate status history
 * GET /api/experience-certificate/:id/history
 * Access: Owner or Admin/HR
 */
router.get('/:id/history', controller.getExperienceHistoryController);

/**
 * Update experience certificate status
 * PATCH /api/experience-certificate/:id/status
 * Access: Admin or HR only
 */
router.patch(
  '/:id/status',
  requireRoles(['ADMIN', 'HR']),
  controller.updateExperienceStatusController
);

export const experienceRouter = router;

