/**
 * Multi-Manager Approval System Routes
 */

import { Router } from 'express';
import { authenticate as requireAuth } from '../../core/middleware/authenticate';
import { requireRoles } from '../../core/middleware/requireRoles';
import * as controller from './multi-approval.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * Get approval progress for a request
 * GET /api/requests/:type/:id/approvals
 * Access: Any authenticated user
 */
router.get(
  '/requests/:type/:id/approvals',
  controller.getApprovalProgress
);

/**
 * Approve a request
 * POST /api/requests/:type/:id/approve
 * Body: { note?: string }
 * Access: Any authenticated user (validated in service layer based on roles OR commissioner tickets)
 */
router.post(
  '/requests/:type/:id/approve',
  controller.approveRequest
);

/**
 * Reject a request
 * POST /api/requests/:type/:id/reject
 * Body: { note: string }
 * Access: Any authenticated user (validated in service layer based on roles OR commissioner tickets)
 */
router.post(
  '/requests/:type/:id/reject',
  controller.rejectRequest
);

/**
 * Get pending approvals for current user
 * GET /api/approvals/pending
 * Access: Any authenticated user (filtered by roles OR commissioner tickets in service layer)
 */
router.get(
  '/pending',
  controller.getPendingApprovals
);

/**
 * Get all supported approval types
 * GET /api/multi-approval/types
 * Access: Any authenticated user
 */
router.get(
  '/types',
  controller.getApprovalTypes
);

/**
 * Get current user's roles
 * GET /api/users/me/roles
 * Access: Any authenticated user
 */
router.get(
  '/users/me/roles',
  controller.getMyRoles
);

/**
 * Initialize approvals for a request (internal use)
 * POST /api/requests/:type/:id/initialize-approvals
 * Access: System/Admin only
 */
router.post(
  '/requests/:type/:id/initialize-approvals',
  requireRoles(['ADMIN']),
  controller.initializeApprovals
);

// ==============================================================
// Admin-only approval management routes
// ==============================================================

/**
 * Get stuck requests
 * GET /api/admin/approvals/stuck-requests
 * Access: Admin only
 */
router.get(
  '/admin/stuck-requests',
  requireRoles(['ADMIN']),
  controller.getStuckRequestsController
);

/**
 * Get approval system health check
 * GET /api/admin/approvals/health-check
 * Access: Admin only
 */
router.get(
  '/admin/health-check',
  requireRoles(['ADMIN']),
  controller.approvalHealthCheckController
);

/**
 * Manually fix a stuck request
 * POST /api/admin/approvals/fix-request
 * Body: { requestType, requestId, action: 'recalculate' | 'approve' | 'reset' }
 * Access: Admin only
 */
router.post(
  '/admin/fix-request',
  requireRoles(['ADMIN']),
  controller.fixRequestController
);

/**
 * Manually recalculate a specific request
 * POST /api/admin/approvals/recalculate
 * Body: { requestType, requestId }
 * Access: Admin only
 */
router.post(
  '/admin/recalculate',
  requireRoles(['ADMIN']),
  controller.recalculateRequestController
);

/**
 * Get overdue requests (72+ hours)
 * GET /api/admin/approvals/overdue
 * Access: Admin only
 */
router.get(
  '/admin/overdue',
  requireRoles(['ADMIN']),
  controller.getOverdueRequestsController
);

/**
 * Get notification history
 * GET /api/admin/approvals/notification-history
 * Access: Admin only
 */
router.get(
  '/admin/notification-history',
  requireRoles(['ADMIN']),
  controller.getNotificationHistoryController
);

/**
 * Notify all admins about stuck requests
 * POST /api/admin/approvals/notify-admins
 * Body: { stuckCount: number }
 * Access: Admin only
 */
router.post(
  '/admin/notify-admins',
  requireRoles(['ADMIN']),
  controller.notifyAdminsController
);

/**
 * Notify all pending approvers for a request
 * POST /api/requests/:type/:id/notify-approvers
 * Access: Any authenticated user
 */
router.post(
  '/requests/:type/:id/notify-approvers',
  controller.notifyPendingApproversController
);

/**
 * Get approval timeline for a request
 * GET /api/requests/:type/:id/timeline
 * Access: Any authenticated user
 */
router.get(
  '/requests/:type/:id/timeline',
  controller.getApprovalTimelineController
);

export default router;

