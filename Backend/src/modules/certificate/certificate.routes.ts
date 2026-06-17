/**
 * Certificate Request (شهادة تعريف) - Routes
 */

import { Router } from 'express';
import { authenticate as requireAuth } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as controller from './certificate.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * Create a new certificate request
 * POST /api/certificate
 * Access: Any authenticated user
 */
router.post('/', controller.createCertificateController);

/**
 * Get user's certificate requests
 * GET /api/certificate
 * Access: Any authenticated user (returns their own certificates)
 */
router.get('/', controller.getUserCertificatesController);

/**
 * Get certificate by ID
 * GET /api/certificate/:id
 * Access: Owner or Admin/HR
 */
router.get('/:id', controller.getCertificateByIdController);

/**
 * Get certificate status history
 * GET /api/certificate/:id/history
 * Access: Owner or Admin/HR
 */
router.get('/:id/history', controller.getCertificateHistoryController);

/**
 * Update certificate status
 * PATCH /api/certificate/:id/status
 * Access: Admin or HR only
 */
router.patch(
  '/:id/status',
  requireRoles(['ADMIN', 'HR']),
  controller.updateCertificateStatusController
);

export const certificateRouter = router;

