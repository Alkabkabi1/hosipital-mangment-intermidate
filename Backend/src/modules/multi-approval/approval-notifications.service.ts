/**
 * Approval Notification Services
 * Handles sending notifications to approvers and admins
 */

import { withConnection } from '../../core/database';

/**
 * Send notification to all pending approvers for a specific request
 */
export async function notifyPendingApprovers(
  requestType: 'clearance' | 'onboarding' | 'delegation' | 'direct' | 'certificate' | 'experience' | 'leave' | 'exit' | 'assignment' | 'assignment_termination' | 'internal_transfer',
  requestId: number,
  notifiedBy: number
): Promise<{ success: boolean; message: string; notified_count: number }> {
  return withConnection(async (conn) => {
    try {
      // Get all pending approvers for this request
      const [approvers] = await conn.execute<any[]>(
        `SELECT DISTINCT ra.approver_id, u.name, u.email
         FROM Request_Approvals ra
         INNER JOIN App_Users u ON ra.approver_id = u.id
         WHERE ra.request_type = ? 
           AND ra.request_id = ?
           AND ra.status = 'pending'
           AND u.is_active = TRUE`,
        [requestType, requestId]
      );

      if (approvers.length === 0) {
        return {
          success: false,
          message: 'لا يوجد معتمدون معلقون لهذا الطلب',
          notified_count: 0
        };
      }

      // Send notification to each pending approver
      for (const approver of approvers) {
        await conn.execute(
          `INSERT INTO Notifications (user_id, title_ar, message_ar, type, reference_id, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            approver.approver_id,
            'تذكير: طلب يحتاج موافقتك',
            `لديك طلب ${requestType} (رقم ${requestId}) في انتظار موافقتك. يرجى المراجعة والموافقة في أقرب وقت.`,
            `${requestType}_reminder`,
            requestId
          ]
        );
      }

      console.log(`✅ Notified ${approvers.length} pending approvers for ${requestType}:${requestId}`);

      return {
        success: true,
        message: `تم إرسال تنبيه إلى ${approvers.length} من المعتمدين`,
        notified_count: approvers.length
      };
    } catch (error) {
      console.error('❌ Error notifying pending approvers:', error);
      throw error;
    }
  });
}

/**
 * Send notification to all admins about stuck requests
 */
export async function notifyAdminsAboutStuckRequests(
  stuckCount: number,
  notifiedBy?: number
): Promise<{ success: boolean; message: string; notified_count: number }> {
  return withConnection(async (conn) => {
    try {
      // Get all admin users
      const [admins] = await conn.execute<any[]>(
        `SELECT DISTINCT u.id, u.name, u.email
         FROM App_Users u
         INNER JOIN user_roles ur ON u.id = ur.user_id
         INNER JOIN roles r ON ur.role_id = r.role_id
         WHERE r.role_name = 'ADMIN'
           AND ur.is_active = TRUE
           AND u.is_active = TRUE`
      );

      if (admins.length === 0) {
        return {
          success: false,
          message: 'لا يوجد مسؤولين لإرسال التنبيه',
          notified_count: 0
        };
      }

      // Send notification to each admin
      const message = stuckCount > 0 
        ? `تنبيه: يوجد ${stuckCount} طلب متعثر يحتاج إلى مراجعة في نظام الاعتمادات`
        : 'تحديث: جميع الطلبات تعمل بشكل طبيعي - لا توجد طلبات متعثرة';

      for (const admin of admins) {
        await conn.execute(
          `INSERT INTO Notifications (user_id, title_ar, message_ar, type, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [
            admin.id,
            stuckCount > 0 ? '⚠️ طلبات متعثرة تحتاج مراجعة' : '✅ النظام يعمل بشكل سليم',
            message,
            'admin_stuck_requests_alert'
          ]
        );
      }

      console.log(`✅ Notified ${admins.length} admins about ${stuckCount} stuck requests`);

      return {
        success: true,
        message: `تم إرسال تنبيه إلى ${admins.length} من المسؤولين`,
        notified_count: admins.length
      };
    } catch (error) {
      console.error('❌ Error notifying admins:', error);
      throw error;
    }
  });
}

/**
 * Get approval timeline for a request (who approved when)
 */
export async function getApprovalTimeline(
  requestType: 'clearance' | 'onboarding' | 'delegation' | 'direct' | 'certificate' | 'experience' | 'leave' | 'exit' | 'assignment' | 'assignment_termination' | 'internal_transfer',
  requestId: number
): Promise<any[]> {
  return withConnection(async (conn) => {
    const [timeline] = await conn.execute<any[]>(
      `SELECT 
         ra.approver_id,
         u.name as approver_name,
         u.email as approver_email,
         r.role_name as approver_role,
         r.role_name_ar as approver_role_ar,
         ra.approval_order,
         ra.status,
         ra.decision_note,
         ra.decided_at,
         ra.created_at,
         TIMESTAMPDIFF(HOUR, ra.created_at, COALESCE(ra.decided_at, NOW())) as hours_elapsed,
         u.last_login
       FROM Request_Approvals ra
       INNER JOIN App_Users u ON ra.approver_id = u.id
       LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
       LEFT JOIN roles r ON ur.role_id = r.role_id
       WHERE ra.request_type = ? AND ra.request_id = ?
       ORDER BY ra.approval_order, ra.created_at`,
      [requestType, requestId]
    );

    return timeline;
  });
}

/**
 * Check if request is overdue (72+ hours old with pending approvals)
 */
export async function getOverdueRequests(): Promise<any[]> {
  return withConnection(async (conn) => {
    const [overdueRequests] = await conn.execute<any[]>(
      `SELECT DISTINCT
         ra.request_type,
         ra.request_id,
         MIN(ra.created_at) as oldest_pending_created,
         TIMESTAMPDIFF(HOUR, MIN(ra.created_at), NOW()) as hours_pending,
         COUNT(CASE WHEN ra.status = 'pending' THEN 1 END) as pending_count,
         COUNT(*) as total_approvers
       FROM Request_Approvals ra
       WHERE ra.status = 'pending'
       GROUP BY ra.request_type, ra.request_id
       HAVING TIMESTAMPDIFF(HOUR, MIN(ra.created_at), NOW()) >= 72
       ORDER BY hours_pending DESC`
    );

    return overdueRequests;
  });
}

/**
 * Get notification history for approval system
 */
export async function getNotificationHistory(limit: number = 50): Promise<any[]> {
  return withConnection(async (conn) => {
    const [history] = await conn.execute<any[]>(
      `SELECT 
         n.id,
         n.user_id,
         u.name as recipient_name,
         u.email as recipient_email,
         n.title_ar,
         n.message_ar,
         n.type,
         n.reference_id,
         n.is_read,
         n.created_at
       FROM Notifications n
       INNER JOIN App_Users u ON n.user_id = u.id
       WHERE n.type IN ('admin_stuck_requests_alert', 'clearance_reminder', 'onboarding_reminder', 
                        'delegation_reminder', 'certificate_reminder', 'experience_reminder', 'direct_reminder')
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [limit]
    );

    return history;
  });
}

