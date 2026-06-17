/**
 * Multi-Manager Approval System Controller
 */

import type { RequestHandler } from 'express';
import * as service from './multi-approval.service';
import * as notificationService from './approval-notifications.service';
// import { sendDelegationNotification } from '../delegation/delegation-notifications.service';
import { withConnection } from '../../core/database';

/**
 * Get approval progress for a specific request
 * GET /api/requests/:type/:id/approvals
 */
export const getApprovalProgress: RequestHandler = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    if (!['clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience', 'leave', 'exit', 'assignment', 'assignment_termination', 'internal_transfer', 'maternity_leave', 'housing_allowance', 'travel_order', 'reward_refund', 'airlines_ticket'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع الطلب غير صحيح'
      });
    }

    const progress = await service.getApprovalProgress(
      type as any,
      parseInt(id)
    );

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a request
 * POST /api/requests/:type/:id/approve
 * Body: { note?: string }
 */
export const approveRequest: RequestHandler = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { note } = req.body;
    const userId = req.auth!.sub;

    if (!['clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience', 'leave', 'exit', 'assignment', 'assignment_termination', 'internal_transfer', 'maternity_leave', 'housing_allowance', 'travel_order', 'reward_refund', 'airlines_ticket'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع الطلب غير صحيح'
      });
    }

    const result = await service.processApproval(
      type as any,
      parseInt(id),
      userId,
      'approved',
      note
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Send notification to request owner
    await sendApprovalNotification(
      type as any,
      parseInt(id),
      userId,
      'approved',
      result.approval_progress
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a request
 * POST /api/requests/:type/:id/reject
 * Body: { note: string }
 */
export const rejectRequest: RequestHandler = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { note } = req.body;
    const userId = req.auth!.sub;

    if (!['clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience', 'leave', 'exit', 'assignment', 'assignment_termination', 'internal_transfer', 'maternity_leave', 'housing_allowance', 'travel_order', 'reward_refund', 'airlines_ticket'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع الطلب غير صحيح'
      });
    }

    if (!note) {
      return res.status(400).json({
        success: false,
        message: 'يجب إدخال سبب الرفض'
      });
    }

    const result = await service.processApproval(
      type as any,
      parseInt(id),
      userId,
      'rejected',
      note
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Send rejection notification
    await sendApprovalNotification(
      type as any,
      parseInt(id),
      userId,
      'rejected',
      result.approval_progress
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending approvals for current user
 * GET /api/approvals/pending
 */
export const getPendingApprovals: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    const approvals = await service.getPendingApprovalsForUser(userId);

    res.json({
      success: true,
      data: approvals
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all supported approval types
 * GET /api/multi-approval/types
 */
export const getApprovalTypes: RequestHandler = async (req, res, next) => {
  try {
    const types = [
      {
        type: 'clearance',
        name: 'Clearance Requests',
        name_ar: 'طلبات إخلاء الطرف',
        description: 'Employee clearance requests',
        table: 'Clearance_Requests',
        approval_levels: 2
      },
      {
        type: 'onboarding',
        name: 'Onboarding Requests', 
        name_ar: 'طلبات المباشرة',
        description: 'Employee onboarding requests',
        table: 'Onboarding_Requests',
        approval_levels: 2
      },
      {
        type: 'assignment',
        name: 'Assignment Requests',
        name_ar: 'طلبات التكليف',
        description: 'Employee assignment to new roles',
        table: 'Assignment_Requests',
        approval_levels: 2
      },
      {
        type: 'assignment_termination',
        name: 'Assignment Termination',
        name_ar: 'إنهاء التكليف',
        description: 'Termination of employee assignments',
        table: 'Assignment_Termination_Requests',
        approval_levels: 2
      },
      {
        type: 'internal_transfer',
        name: 'Internal Transfer',
        name_ar: 'النقل الداخلي',
        description: 'Internal department transfers',
        table: 'Internal_Transfer_Requests', 
        approval_levels: 2
      },
      {
        type: 'certificate',
        name: 'Employment Certificate',
        name_ar: 'شهادة تعريف بالراتب',
        description: 'Employment certificate requests',
        table: 'Certificate_Requests',
        approval_levels: 1
      },
      {
        type: 'experience',
        name: 'Experience Certificate',
        name_ar: 'شهادة خبرة',
        description: 'Experience certificate requests', 
        table: 'Experience_Certificate_Requests',
        approval_levels: 1
      },
      {
        type: 'leave',
        name: 'Leave Request',
        name_ar: 'طلب إجازة',
        description: 'Employee leave requests',
        table: 'Leave_Requests',
        approval_levels: 2
      },
      {
        type: 'exit',
        name: 'Exit Request',
        name_ar: 'طلب إنهاء العمل',
        description: 'Employee exit requests',
        table: 'Exit_Requests',
        approval_levels: 3
      },
      {
        type: 'delegation',
        name: 'Delegation Request',
        name_ar: 'طلب تفويض',
        description: 'Authority delegation requests',
        table: 'Delegation_Requests',
        approval_levels: 1
      }
    ];

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's current roles
 * GET /api/users/me/roles
 */
export const getMyRoles: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.auth!.sub;
    
    const roles = await withConnection(async (conn) => {
      const [rows] = await conn.execute<any[]>(
        `SELECT 
          r.role_id,
          r.role_name,
          r.role_name_ar,
          r.description,
          ur.assigned_by,
          ur.assigned_at,
          ab.name AS assigned_by_name,
          ur.is_active
         FROM user_roles ur
         INNER JOIN roles r ON ur.role_id = r.role_id
         LEFT JOIN App_Users ab ON ur.assigned_by = ab.id
         WHERE ur.user_id = ? AND ur.is_active = TRUE AND r.is_active = TRUE
         ORDER BY ur.assigned_at DESC`,
        [userId]
      );
      return rows;
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initialize approvals when a new request is created
 * This should be called by the request creation endpoints
 */
export const initializeApprovals: RequestHandler = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    if (!['clearance', 'onboarding', 'delegation', 'direct', 'certificate', 'experience', 'leave', 'exit', 'assignment', 'assignment_termination', 'internal_transfer'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع الطلب غير صحيح'
      });
    }

    await service.initializeRequestApprovals(
      type as any,
      parseInt(id)
    );

    // Notify all approvers
    await notifyApprovers(type as any, parseInt(id));

    res.json({
      success: true,
      message: 'تم إنشاء سير الموافقات بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Send approval notification
async function sendApprovalNotification(
  requestType: string,
  requestId: number,
  approverId: number,
  decision: 'approved' | 'rejected',
  progress?: any
) {
  try {
    await withConnection(async (conn) => {
      // Get request owner
      const [ownerResult] = await conn.execute<any[]>(
        `SELECT
          CASE
            WHEN ? = 'clearance' THEN cr.employee_id
            WHEN ? = 'onboarding' THEN onb.employee_id
            WHEN ? = 'delegation' THEN dr.created_by_user
            WHEN ? = 'certificate' THEN cert.employee_id
            WHEN ? = 'experience' THEN exp.employee_id
            ELSE NULL
          END AS owner_id
         FROM (SELECT 1) dummy
         LEFT JOIN Clearance_Requests cr ON ? = 'clearance' AND cr.id = ?
         LEFT JOIN Onboarding_Requests onb ON ? = 'onboarding' AND onb.id = ?
         LEFT JOIN Delegation_Requests dr ON ? = 'delegation' AND dr.id = ?
         LEFT JOIN Certificate_Requests cert ON ? = 'certificate' AND cert.id = ?
         LEFT JOIN Experience_Certificate_Requests exp ON ? = 'experience' AND exp.id = ?`,
        [requestType, requestType, requestType, requestType, requestType, requestType, requestId, requestType, requestId, requestType, requestId, requestType, requestId, requestType, requestId]
      );

      const ownerId = ownerResult[0]?.owner_id;
      if (!ownerId) return;

      // Get approver name
      const [approverResult] = await conn.execute<any[]>(
        'SELECT name FROM App_Users WHERE id = ?',
        [approverId]
      );
      const approverName = approverResult[0]?.name || 'مدير';

      // Create notification message
      let title_ar, message_ar;
      if (decision === 'approved') {
        if (progress && progress.approved_count === progress.total_approvers) {
          title_ar = 'تمت الموافقة على طلبك';
          message_ar = `تمت الموافقة على طلبك من جميع المدراء (${progress.total_approvers}/${progress.total_approvers})`;
        } else {
          title_ar = 'موافقة جديدة على طلبك';
          message_ar = `وافق ${approverName} على طلبك (${progress?.approved_count || 0}/${progress?.total_approvers || 0})`;
        }
      } else {
        title_ar = 'تم رفض طلبك';
        message_ar = `تم رفض طلبك من قبل ${approverName}`;
      }

      // Insert notification
      await conn.execute(
        `INSERT INTO Notifications (user_id, title_ar, message_ar, type, reference_id)
         VALUES (?, ?, ?, ?, ?)`,
        [ownerId, title_ar, message_ar, `${requestType}_${decision}`, requestId]
      );
    });
  } catch (error) {
    console.error('Failed to send approval notification:', error);
  }
}

// Helper: Notify all approvers when request is created
async function notifyApprovers(requestType: string, requestId: number) {
  try {
    await withConnection(async (conn) => {
      // Get all approvers
      const [approvers] = await conn.execute<any[]>(
        `SELECT DISTINCT u.id, u.name
         FROM Request_Approvals ra
         INNER JOIN App_Users u ON ra.approver_id = u.id
         WHERE ra.request_type = ? AND ra.request_id = ? AND ra.status = 'pending'`,
        [requestType, requestId]
      );

      // Send notification to each approver
      for (const approver of approvers) {
        await conn.execute(
          `INSERT INTO Notifications (user_id, title_ar, message_ar, type, reference_id)
           VALUES (?, ?, ?, ?, ?)`,
          [
            approver.id,
            'طلب جديد يتطلب موافقتك',
            `لديك طلب ${requestType === 'clearance' ? 'إخلاء طرف' : requestType === 'onboarding' ? 'تعيين' : requestType === 'delegation' ? 'تفويض' : requestType === 'certificate' ? 'شهادة تعريف' : requestType === 'experience' ? 'شهادة خبرة' : 'جديد'} يتطلب موافقتك`,
            `${requestType}_new_approval`,
            requestId
          ]
        );
      }
    });
  } catch (error) {
    console.error('Failed to notify approvers:', error);
  }
}

/**
 * Get stuck requests (admin only)
 * GET /api/admin/approvals/stuck-requests
 */
export const getStuckRequestsController: RequestHandler = async (req, res, next) => {
  try {
    const stuckRequests = await service.getStuckRequests();
    
    res.json({
      success: true,
      data: stuckRequests,
      total: stuckRequests.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually fix a stuck request (admin only)
 * POST /api/admin/approvals/fix-request
 * Body: { requestType, requestId, action }
 */
export const fixRequestController: RequestHandler = async (req, res, next) => {
  try {
    const { requestType, requestId, action } = req.body;
    
    if (!requestType || !requestId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: requestType, requestId, action'
      });
    }
    
    if (!['recalculate', 'approve', 'reset'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be: recalculate, approve, or reset'
      });
    }
    
    const result = await service.manuallyFixRequest(
      requestType,
      parseInt(requestId),
      action
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get approval system health check (admin only)
 * GET /api/admin/approvals/health-check
 */
export const approvalHealthCheckController: RequestHandler = async (req, res, next) => {
  try {
    console.log('🏥 [Controller] Health check requested by user:', req.auth?.sub);
    const health = await service.getApprovalSystemHealth();
    
    console.log('✅ [Controller] Health check successful:', health);
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('❌ [Controller] Health check failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Send detailed error to frontend
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: errorMessage,
      details: errorStack,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Manually recalculate a specific request (admin only)
 * POST /api/admin/approvals/recalculate
 * Body: { requestType, requestId }
 */
export const recalculateRequestController: RequestHandler = async (req, res, next) => {
  try {
    const { requestType, requestId } = req.body;
    
    if (!requestType || !requestId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: requestType, requestId'
      });
    }
    
    await service.recalculateRequestApprovals(requestType, parseInt(requestId));
    
    res.json({
      success: true,
      message: `تم إعادة حساب الاعتمادات للطلب ${requestType}:${requestId}`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Notify all pending approvers for a request
 * POST /api/requests/:type/:id/notify-approvers
 * Access: Admin or request owner
 */
export const notifyPendingApproversController: RequestHandler = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const userId = req.auth!.sub;

    const result = await notificationService.notifyPendingApprovers(
      type as any,
      parseInt(id),
      userId
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Notify all admins about stuck requests
 * POST /api/admin/approvals/notify-admins
 * Body: { stuckCount: number }
 * Access: Admin only
 */
export const notifyAdminsController: RequestHandler = async (req, res, next) => {
  try {
    const { stuckCount } = req.body;
    const userId = req.auth?.sub;

    const result = await notificationService.notifyAdminsAboutStuckRequests(
      stuckCount || 0,
      userId
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get approval timeline for a request
 * GET /api/requests/:type/:id/timeline
 * Access: Any authenticated user
 */
export const getApprovalTimelineController: RequestHandler = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    const timeline = await notificationService.getApprovalTimeline(
      type as any,
      parseInt(id)
    );

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get overdue requests (72+ hours)
 * GET /api/admin/approvals/overdue
 * Access: Admin only
 */
export const getOverdueRequestsController: RequestHandler = async (req, res, next) => {
  try {
    const overdueRequests = await notificationService.getOverdueRequests();

    res.json({
      success: true,
      data: overdueRequests,
      total: overdueRequests.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification history
 * GET /api/admin/approvals/notification-history
 * Access: Admin only
 */
export const getNotificationHistoryController: RequestHandler = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await notificationService.getNotificationHistory(limit);

    res.json({
      success: true,
      data: history,
      total: history.length
    });
  } catch (error) {
    next(error);
  }
};

