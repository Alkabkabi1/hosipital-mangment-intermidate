/**
 * Multi-Manager Approval System Service
 * Handles approval workflows where ALL managers must approve requests
 */

import { withConnection, withTransaction } from '../../core/database';
import type { PoolConnection } from 'mysql2/promise';

export interface ApprovalRecord {
  approval_id: number;
  request_type: 'clearance' | 'onboarding' | 'delegation' | 'direct' | 'certificate' | 'experience' | 'leave' | 'exit' | 'assignment' | 'assignment_termination' | 'internal_transfer' | 'maternity_leave' | 'housing_allowance' | 'travel_order' | 'reward_refund' | 'airlines_ticket';
  request_id: number;
  approver_id: number;
  approver_name: string;
  approver_role: string;
  approval_order: number;
  status: 'pending' | 'approved' | 'rejected';
  decision_note?: string;
  decided_at?: Date;
  created_at: Date;
}

export interface ApprovalProgress {
  total_approvers: number;
  approved_count: number;
  pending_count: number;
  rejected_count: number;
  approval_stage: string;
  final_decision: 'pending' | 'approved' | 'rejected';
  approvals: ApprovalRecord[];
}

/**
 * Initialize approval workflow for a new request
 */
export async function initializeRequestApprovals(
  requestType: 'clearance' | 'onboarding' | 'delegation' | 'direct' | 'certificate' | 'experience' | 'leave' | 'exit' | 'assignment' | 'assignment_termination' | 'internal_transfer' | 'maternity_leave' | 'housing_allowance' | 'travel_order' | 'reward_refund' | 'airlines_ticket',
  requestId: number
): Promise<void> {
  await withTransaction(async (conn) => {
    // Get UNIQUE approvers (users may have multiple roles, count them only once)
    // Group by user_id to get the FIRST role they match for approval order
    const [approvers] = await conn.execute<any[]>(
      `SELECT 
         u.id as approver_id, 
         MIN(ar.approval_order) as approval_order,
         GROUP_CONCAT(DISTINCT r.role_name) as role_names
       FROM Approval_Rules ar
       INNER JOIN roles r ON ar.role_name = r.role_name
       INNER JOIN user_roles ur ON r.role_id = ur.role_id
       INNER JOIN App_Users u ON ur.user_id = u.id
       WHERE ar.request_type = ?
         AND ar.is_active = TRUE
         AND ar.is_required = TRUE
         AND ur.is_active = TRUE
         AND u.is_active = TRUE
       GROUP BY u.id
       ORDER BY MIN(ar.approval_order), u.id`,
      [requestType]
    );

    console.log(`✅ Found ${approvers.length} UNIQUE approvers for ${requestType} request ${requestId}`);

    // Delete any existing approvals (in case of reinitialization)
    await conn.execute(
      `DELETE FROM Request_Approvals WHERE request_type = ? AND request_id = ?`,
      [requestType, requestId]
    );

    // Create approval records for each UNIQUE approver (only once per person)
    for (const approver of approvers) {
      await conn.execute(
        `INSERT INTO Request_Approvals (request_type, request_id, approver_id, approval_order, status)
         VALUES (?, ?, ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE status = 'pending', decided_at = NULL, decision_note = NULL`,
        [requestType, requestId, approver.approver_id, approver.approval_order]
      );
      console.log(`  → Added approver: ${approver.approver_id} (order: ${approver.approval_order}, roles: ${approver.role_names})`);
    }

    // Update request with CORRECT total approvers count (unique users)
    const tableName = getRequestTableName(requestType);
    const idColumn = getRequestIdColumn(requestType);
    
    await conn.execute(
      `UPDATE ${tableName}
       SET total_approvers = ?,
           approved_count = 0,
           approval_stage = 'Pending Review',
           final_decision = 'pending'
       WHERE ${idColumn} = ?`,
      [approvers.length, requestId]
    );
    
    console.log(`✅ Initialized ${approvers.length} approval records for ${requestType} request ${requestId}`);
  });
}

/**
 * Process an approval or rejection
 * Supports both role-based approvers AND commissioner tickets
 */
export async function processApproval(
  requestType: 'clearance' | 'onboarding' | 'delegation' | 'direct' | 'certificate' | 'experience' | 'leave' | 'exit' | 'assignment' | 'assignment_termination' | 'internal_transfer' | 'maternity_leave' | 'housing_allowance' | 'travel_order' | 'reward_refund' | 'airlines_ticket',
  requestId: number,
  approverId: number,
  decision: 'approved' | 'rejected',
  note?: string
): Promise<{ success: boolean; message: string; approval_progress?: ApprovalProgress }> {
  return withTransaction(async (conn) => {
    // OPTION A: Check if user is in Request_Approvals (role-based approval)
    const [approval] = await conn.execute<any[]>(
      `SELECT approval_id, status FROM Request_Approvals
       WHERE request_type = ? AND request_id = ? AND approver_id = ?`,
      [requestType, requestId, approverId]
    );

    let isRoleBasedApprover = approval.length > 0;
    let isCommissioner = false;
    let isAdmin = false;

    // OPTION A.5: Check if user is ADMIN (can approve anything)
    const [adminCheck] = await conn.execute<any[]>(
      `SELECT r.role_name
       FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = ? AND ur.is_active = TRUE AND r.role_name = 'ADMIN'`,
      [approverId]
    );
    isAdmin = adminCheck.length > 0;

    // OPTION B: If not in Request_Approvals and not admin, check for commissioner ticket
    if (!isRoleBasedApprover && !isAdmin) {
      const [tickets] = await conn.execute<any[]>(
        `SELECT scopes_json
         FROM Commissioner_Tickets
         WHERE subject_user_id = ?
           AND valid_from <= NOW()
           AND valid_to >= NOW()
           AND revoked_at IS NULL`,
        [approverId]
      );

      if (tickets.length > 0) {
        try {
          const scopes: string[] = JSON.parse(tickets[0].scopes_json || '[]');
          isCommissioner = scopes.includes(requestType);
        } catch (e) {
          console.error('Failed to parse commissioner scopes:', e);
        }
      }
    }

    // Deny if neither role-based approver, commissioner, nor admin
    if (!isRoleBasedApprover && !isCommissioner && !isAdmin) {
      return {
        success: false,
        message: 'ليس لديك صلاحية للموافقة على هذا الطلب'
      };
    }
    
    // Check if already approved (only for role-based approvers)
    if (isRoleBasedApprover && approval[0].status !== 'pending') {
      // Log the duplicate decision attempt for debugging
      console.log(`⚠️ Duplicate decision attempt by user ${approverId} for ${requestType}:${requestId}`, {
        existingStatus: approval[0].status,
        attemptedDecision: decision,
        approvalRecord: approval[0]
      });
      
      return { 
        success: false, 
        message: `لقد قمت بالفعل بإتخاذ قرار على هذا الطلب. الحالة الحالية: ${approval[0].status === 'approved' ? 'موافق' : approval[0].status === 'rejected' ? 'مرفوض' : approval[0].status}`
      };
    }

    // Update approval record (only for role-based approvers)
    if (isRoleBasedApprover) {
      await conn.execute(
        `UPDATE Request_Approvals
         SET status = ?, decision_note = ?, decided_at = NOW()
         WHERE approval_id = ?`,
        [decision, note || null, approval[0].approval_id]
      );
    }
    
    // For commissioners or admins, create a new approval record to track their action
    if ((isCommissioner || isAdmin) && !isRoleBasedApprover) {
      await conn.execute(
        `INSERT INTO Request_Approvals
         (request_type, request_id, approver_id, approval_order, status, decision_note, decided_at)
         VALUES (?, ?, ?, 999, ?, ?, NOW())`,
        [requestType, requestId, approverId, decision, note || null]
      );

      console.log(`✅ ${isAdmin ? 'Admin' : 'Commissioner'} ${approverId} ${decision} request ${requestType}:${requestId}`);
    }

    // If rejected, mark all other approvals as obsolete and update request
    if (decision === 'rejected') {
      await handleRejection(conn, requestType, requestId, approverId, note);
      return {
        success: true,
        message: 'تم رفض الطلب',
        approval_progress: await getApprovalProgress(requestType, requestId)
      };
    }

    // If approved, update counts and check if all approved
    await updateApprovalProgress(conn, requestType, requestId);
    
    const progress = await getApprovalProgress(requestType, requestId);
    
    if (progress.approved_count === progress.total_approvers) {
      // All approvals received - mark request as completed
      await finalizeApprovedRequest(conn, requestType, requestId, approverId);
      return {
        success: true,
        message: 'تم اعتماد الطلب بنجاح - تمت الموافقة من جميع المدراء',
        approval_progress: progress
      };
    }

    return {
      success: true,
      message: `تم تسجيل موافقتك (${progress.approved_count}/${progress.total_approvers})`,
      approval_progress: progress
    };
  });
}

/**
 * Get approval progress for a request
 */
export async function getApprovalProgress(
  requestType: 'clearance' | 'onboarding' | 'delegation' | 'direct' | 'certificate' | 'experience' | 'leave' | 'exit' | 'assignment' | 'assignment_termination' | 'internal_transfer' | 'maternity_leave' | 'housing_allowance' | 'travel_order' | 'reward_refund' | 'airlines_ticket',
  requestId: number
): Promise<ApprovalProgress> {
  return withConnection(async (conn) => {
    const [approvals] = await conn.execute<any[]>(
      `SELECT 
         ra.approval_id,
         ra.request_type,
         ra.request_id,
         ra.approver_id,
         u.name as approver_name,
         r.role_name as approver_role,
         ra.approval_order,
         ra.status,
         ra.decision_note,
         ra.decided_at,
         ra.created_at
       FROM Request_Approvals ra
       INNER JOIN App_Users u ON ra.approver_id = u.id
       INNER JOIN user_roles ur ON u.id = ur.user_id
       INNER JOIN roles r ON ur.role_id = r.role_id
       WHERE ra.request_type = ? AND ra.request_id = ?
       ORDER BY ra.approval_order, u.name`,
      [requestType, requestId]
    );

    const total = approvals.length;
    const approved = approvals.filter((a: any) => a.status === 'approved').length;
    const pending = approvals.filter((a: any) => a.status === 'pending').length;
    const rejected = approvals.filter((a: any) => a.status === 'rejected').length;

    let stage = 'Pending Review';
    let final_decision: 'pending' | 'approved' | 'rejected' = 'pending';

    if (rejected > 0) {
      stage = 'Rejected';
      final_decision = 'rejected';
    } else if (approved === total) {
      stage = 'Fully Approved';
      final_decision = 'approved';
    } else if (approved > 0) {
      stage = `In Progress (${approved}/${total})`;
    }

    return {
      total_approvers: total,
      approved_count: approved,
      pending_count: pending,
      rejected_count: rejected,
      approval_stage: stage,
      final_decision,
      approvals: approvals as ApprovalRecord[]
    };
  });
}

/**
 * Get pending approvals for user based on ROLES or COMMISSIONER TICKETS
 */
export async function getPendingApprovalsForUser(userId: number): Promise<any[]> {
  return withConnection(async (conn) => {
    // Step 1: Get user's active roles
    const [userRoles] = await conn.execute<any[]>(
      `SELECT r.role_name 
       FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.role_id
       WHERE ur.user_id = ? AND ur.is_active = TRUE AND r.is_active = TRUE`,
      [userId]
    );
    
    const roles = userRoles.map((r: any) => r.role_name);
    const hasApprovalRole = roles.some(r => ['HR', 'MANAGER', 'FINANCE', 'IT', 'ADMIN'].includes(r));
    const isAdmin = roles.includes('ADMIN');
    
    // Step 2: Get active commissioner tickets
    const [tickets] = await conn.execute<any[]>(
      `SELECT scopes_json 
       FROM Commissioner_Tickets
       WHERE subject_user_id = ? 
         AND valid_from <= NOW() 
         AND valid_to >= NOW() 
         AND revoked_at IS NULL`,
      [userId]
    );
    
    let commissionerScopes: string[] = [];
    if (tickets.length > 0) {
      try {
        commissionerScopes = JSON.parse(tickets[0].scopes_json || '[]');
      } catch (e) {
        console.error('Failed to parse commissioner scopes:', e);
      }
    }
    
    // Step 3: Build combined query
    let whereConditions: string[] = [];
    let params: any[] = [];

    // ADMIN users can see ALL pending approvals
    if (isAdmin) {
      // No additional conditions - ADMIN can see everything
      console.log(`User ${userId} is ADMIN - can see all pending approvals`);
    } else {
      // If user has approval roles, include role-based approvals
      if (hasApprovalRole) {
        whereConditions.push('ra.approver_id = ?');
        params.push(userId);
      }

      // If user has commissioner tickets, include those request types
      if (commissionerScopes.length > 0) {
        const scopeConditions = commissionerScopes.map(() => 'ra.request_type = ?').join(' OR ');
        whereConditions.push(`(${scopeConditions})`);
        params.push(...commissionerScopes);
      }

      // If no approval capability, return empty
      if (whereConditions.length === 0) {
        console.log(`User ${userId} has no approval capabilities (no roles or tickets)`);
        return [];
      }
    }
    
    // Step 4: Execute combined query
    const [approvals] = await conn.execute<any[]>(
      `SELECT 
         ra.approval_id,
         ra.request_type,
         ra.request_id,
         ra.approval_order,
         ra.created_at,
         req_owner.name as request_owner_name,
         req_owner.email as request_owner_email,
         CASE ra.request_type
           WHEN 'clearance' THEN cr.status
           WHEN 'onboarding' THEN onb.status
           WHEN 'delegation' THEN dr.status
           WHEN 'certificate' THEN cert.status
           WHEN 'experience' THEN exp.status
           WHEN 'leave' THEN lv.status
           WHEN 'exit' THEN ex.status
           WHEN 'assignment' THEN ar.status
           WHEN 'assignment_termination' THEN atr.status
           WHEN 'internal_transfer' THEN itr.status
           ELSE NULL
         END as request_status,
         CASE ra.request_type
           WHEN 'clearance' THEN cr.approval_stage
           WHEN 'onboarding' THEN onb.approval_stage
           WHEN 'delegation' THEN dr.approval_stage
           WHEN 'certificate' THEN cert.approval_stage
           WHEN 'experience' THEN exp.approval_stage
           WHEN 'leave' THEN lv.approval_stage
           WHEN 'exit' THEN ex.approval_stage
           WHEN 'assignment' THEN ar.approval_stage
           WHEN 'assignment_termination' THEN atr.approval_stage
           WHEN 'internal_transfer' THEN itr.approval_stage
           ELSE NULL
         END as approval_stage,
         CASE ra.request_type
           WHEN 'clearance' THEN cr.approved_count
           WHEN 'onboarding' THEN onb.approved_count
           WHEN 'delegation' THEN dr.approved_count
           WHEN 'certificate' THEN cert.approved_count
           WHEN 'experience' THEN exp.approved_count
           WHEN 'leave' THEN lv.approved_count
           WHEN 'exit' THEN ex.approved_count
           WHEN 'assignment' THEN ar.approved_count
           WHEN 'assignment_termination' THEN atr.approved_count
           WHEN 'internal_transfer' THEN itr.approved_count
           ELSE 0
         END as approved_count,
         CASE ra.request_type
           WHEN 'clearance' THEN cr.total_approvers
           WHEN 'onboarding' THEN onb.total_approvers
           WHEN 'delegation' THEN dr.total_approvers
           WHEN 'certificate' THEN cert.total_approvers
           WHEN 'experience' THEN exp.total_approvers
           WHEN 'leave' THEN lv.total_approvers
           WHEN 'exit' THEN ex.total_approvers
           WHEN 'assignment' THEN ar.total_approvers
           WHEN 'assignment_termination' THEN atr.total_approvers
           WHEN 'internal_transfer' THEN itr.total_approvers
           ELSE 0
         END as total_approvers
       FROM Request_Approvals ra
       LEFT JOIN Clearance_Requests cr ON ra.request_type = 'clearance' AND ra.request_id = cr.id
       LEFT JOIN Onboarding_Requests onb ON ra.request_type = 'onboarding' AND ra.request_id = onb.id
       LEFT JOIN Delegation_Requests dr ON ra.request_type = 'delegation' AND ra.request_id = dr.id
       LEFT JOIN Certificate_Requests cert ON ra.request_type = 'certificate' AND ra.request_id = cert.id
       LEFT JOIN Experience_Certificate_Requests exp ON ra.request_type = 'experience' AND ra.request_id = exp.id
       LEFT JOIN Leave_Requests lv ON ra.request_type = 'leave' AND ra.request_id = lv.id
       LEFT JOIN Exit_Requests ex ON ra.request_type = 'exit' AND ra.request_id = ex.id
       LEFT JOIN Assignment_Requests ar ON ra.request_type = 'assignment' AND ra.request_id = ar.id
       LEFT JOIN Assignment_Termination_Requests atr ON ra.request_type = 'assignment_termination' AND ra.request_id = atr.id
       LEFT JOIN Internal_Transfer_Requests itr ON ra.request_type = 'internal_transfer' AND ra.request_id = itr.id
       LEFT JOIN App_Users req_owner ON (
         CASE ra.request_type
           WHEN 'clearance' THEN cr.employee_id
           WHEN 'onboarding' THEN onb.employee_id
           WHEN 'delegation' THEN dr.created_by_user
           WHEN 'certificate' THEN cert.employee_id
           WHEN 'experience' THEN exp.employee_id
           WHEN 'leave' THEN lv.employee_id
           WHEN 'exit' THEN ex.employee_id
           WHEN 'assignment' THEN ar.employee_id
           WHEN 'assignment_termination' THEN atr.employee_id
           WHEN 'internal_transfer' THEN itr.employee_id
           ELSE NULL
         END = req_owner.id
       )
       WHERE ra.status = 'pending'
         ${isAdmin ? '' : `AND (${whereConditions.join(' OR ')})`}
         AND (
           (ra.request_type = 'clearance' AND cr.id IS NOT NULL) OR
           (ra.request_type = 'onboarding' AND onb.id IS NOT NULL) OR
           (ra.request_type = 'delegation' AND dr.id IS NOT NULL) OR
           (ra.request_type = 'certificate' AND cert.id IS NOT NULL) OR
           (ra.request_type = 'experience' AND exp.id IS NOT NULL) OR
           (ra.request_type = 'leave' AND lv.id IS NOT NULL) OR
           (ra.request_type = 'exit' AND ex.id IS NOT NULL) OR
           (ra.request_type = 'assignment' AND ar.id IS NOT NULL) OR
           (ra.request_type = 'assignment_termination' AND atr.id IS NOT NULL) OR
           (ra.request_type = 'internal_transfer' AND itr.id IS NOT NULL)
         )
       ORDER BY ra.created_at DESC`,
      params
    );

    console.log(`✅ Found ${approvals.length} pending approvals for user ${userId} (roles: ${roles.join(',')}, commissioner scopes: ${commissionerScopes.join(',')})`);
    return approvals;
  });
}

// Helper functions

function getRequestTableName(requestType: string): string {
  switch (requestType) {
    case 'clearance': return 'Clearance_Requests';
    case 'onboarding': return 'Onboarding_Requests';
    case 'delegation': return 'Delegation_Requests';
    case 'direct': return 'Direct_Requests';
    case 'certificate': return 'Certificate_Requests';
    case 'experience': return 'Experience_Certificate_Requests';
    case 'leave': return 'Leave_Requests';
    case 'exit': return 'Exit_Requests';
    case 'assignment': return 'Assignment_Requests';
    case 'assignment_termination': return 'Assignment_Termination_Requests';
    case 'internal_transfer': return 'Internal_Transfer_Requests';
    case 'maternity_leave': return 'Maternity_Leave_Requests';
    case 'housing_allowance': return 'Housing_Allowance_Requests';
    default: throw new Error('Invalid request type');
  }
}

function getRequestIdColumn(requestType: string): string {
  // All request tables use 'id' as the primary key column
  return 'id';
}

async function handleRejection(
  conn: PoolConnection,
  requestType: string,
  requestId: number,
  rejectedBy: number,
  note?: string
): Promise<void> {
  // Mark all pending approvals as obsolete
  await conn.execute(
    `UPDATE Request_Approvals
     SET status = 'rejected'
     WHERE request_type = ? AND request_id = ? AND status = 'pending'`,
    [requestType, requestId]
  );

  const tableName = getRequestTableName(requestType);
  const idColumn = getRequestIdColumn(requestType);

  // Build appropriate UPDATE query based on table structure
  let updateFields = [
    'final_decision = \'rejected\'',
    'approval_stage = \'Rejected\'',
    'status = \'مرفوض\'',
    'rejection_reason = ?'
  ];

  let params: any[] = [note || null];

  // Add table-specific fields that exist
  if (requestType === 'clearance' || requestType === 'onboarding' || requestType === 'delegation' || requestType === 'leave' || requestType === 'exit' || requestType === 'assignment' || requestType === 'assignment_termination' || requestType === 'internal_transfer') {
    // These tables have approved_by and approved_at
    updateFields.push('approved_by = ?');
    updateFields.push('approved_at = NOW()');
    params.unshift(rejectedBy);
  } else if (requestType === 'certificate' || requestType === 'experience') {
    // These tables only have approved_at
    updateFields.push('approved_at = NOW()');
  }

  params.push(requestId);

  await conn.execute(
    `UPDATE ${tableName}
     SET ${updateFields.join(', ')}
     WHERE ${idColumn} = ?`,
    params
  );
}

async function updateApprovalProgress(
  conn: PoolConnection,
  requestType: string,
  requestId: number
): Promise<void> {
  const [counts] = await conn.execute<any[]>(
    `SELECT 
       COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
       COUNT(*) as total
     FROM Request_Approvals
     WHERE request_type = ? AND request_id = ?`,
    [requestType, requestId]
  );

  const { approved, total } = counts[0];
  
  let stage = 'In Progress';
  let statusText = 'قيد الاعتماد';
  
  if (approved >= total / 2) {
    stage = 'Final Review';
    statusText = 'قيد المراجعة النهائية';
  }
  if (approved === total) {
    stage = 'Fully Approved';
    statusText = 'مكتمل';
  }

  const tableName = getRequestTableName(requestType);
  const idColumn = getRequestIdColumn(requestType);

  // Build appropriate UPDATE query based on table structure with enhanced field handling
  let updateFields = ['approved_count = ?', 'approval_stage = ?', 'status = ?'];
  let params: any[] = [approved, stage, statusText];

  // Add table-specific fields that exist
  if (requestType === 'clearance' || requestType === 'onboarding' || requestType === 'delegation' || requestType === 'leave' || requestType === 'exit' || requestType === 'assignment' || requestType === 'assignment_termination' || requestType === 'internal_transfer') {
    // These tables have last_approval_at
    updateFields.push('last_approval_at = NOW()');
  }

  // Update final_decision field if request is fully approved
  if (approved === total) {
    updateFields.push('final_decision = ?');
    params.splice(-1, 0, 'approved'); // Insert before requestId
  }

  params.push(requestId);

  try {
    await conn.execute(
      `UPDATE ${tableName}
       SET ${updateFields.join(', ')}
       WHERE ${idColumn} = ?`,
      params
    );

    console.log(`✅ Status updated for ${requestType}:${requestId} - ${approved}/${total} approvals, stage: ${stage}`);
    
    // Add status history record for tracking
    await addStatusHistory(conn, requestType, requestId, statusText, 'System');
  } catch (error) {
    console.error(`❌ Failed to update approval progress for ${requestType}:${requestId}:`, error);
    throw error;
  }
}

async function addStatusHistory(
  conn: PoolConnection,
  requestType: string,
  requestId: number,
  newStatus: string,
  changedBy: string | number
): Promise<void> {
  // Map request types to their status history table names
  const historyTableMap: { [key: string]: string } = {
    'exit': 'Exit_Request_Status_History',
    'leave': 'Leave_Request_Status_History',
    'assignment': 'Assignment_Status_History',
    'assignment_termination': 'Assignment_Termination_Status_History',
    'internal_transfer': 'Internal_Transfer_Status_History'
  };

  const historyTable = historyTableMap[requestType];
  if (!historyTable) {
    // For request types without dedicated history tables, we'll log to a general audit log
    console.log(`📝 Status change logged: ${requestType}:${requestId} -> ${newStatus} by ${changedBy}`);
    return;
  }

  try {
    // Get current status first to record old status
    const tableName = getRequestTableName(requestType);
    const idColumn = getRequestIdColumn(requestType);
    
    const [currentRows] = await conn.execute<any[]>(
      `SELECT status FROM ${tableName} WHERE ${idColumn} = ?`,
      [requestId]
    );

    const oldStatus = currentRows.length > 0 ? currentRows[0].status : null;

    // Insert status history record
    await conn.execute(
      `INSERT INTO ${historyTable} 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, ?, ?, ?, ?)`,
      [requestId, oldStatus, newStatus, changedBy, `Status updated via approval system`]
    );

    console.log(`📝 Status history recorded: ${requestType}:${requestId} ${oldStatus} -> ${newStatus}`);
  } catch (error) {
    console.error(`❌ Failed to add status history for ${requestType}:${requestId}:`, error);
    // Don't throw error - status history failure shouldn't block approval process
  }
}

async function finalizeApprovedRequest(
  conn: PoolConnection,
  requestType: string,
  requestId: number,
  finalApproverId: number
): Promise<void> {
  const tableName = getRequestTableName(requestType);
  const idColumn = getRequestIdColumn(requestType);

  // Build appropriate UPDATE query based on table structure
  let updateFields = [
    'final_decision = \'approved\'',
    'approval_stage = \'Fully Approved\'',
    'status = \'مكتمل\''
  ];

  let params: any[] = [];

  // Add table-specific fields that exist
  if (requestType === 'clearance' || requestType === 'onboarding' || requestType === 'delegation' || requestType === 'leave' || requestType === 'exit' || requestType === 'assignment' || requestType === 'assignment_termination' || requestType === 'internal_transfer') {
    // These tables have approved_by and last_approval_at
    updateFields.push('approved_by = ?');
    updateFields.push('approved_at = NOW()');
    updateFields.push('last_approval_at = NOW()');
    params.push(finalApproverId);
  } else if (requestType === 'certificate' || requestType === 'experience') {
    // These tables only have approved_at
    updateFields.push('approved_at = NOW()');
  }

  params.push(requestId);

  await conn.execute(
    `UPDATE ${tableName}
     SET ${updateFields.join(', ')}
     WHERE ${idColumn} = ?`,
    params
  );
}

/**
 * Recalculate approval counts for a request
 * Called manually or by triggers when approvers are deleted
 */
export async function recalculateRequestApprovals(
  requestType: 'clearance' | 'onboarding' | 'delegation' | 'direct' | 'certificate' | 'experience' | 'leave' | 'exit' | 'assignment' | 'assignment_termination' | 'internal_transfer',
  requestId: number
): Promise<void> {
  return withConnection(async (conn) => {
    await conn.execute(
      'CALL SP_Recalculate_Request_Approvals(?, ?)',
      [requestType, requestId]
    );
    console.log(`✅ Recalculated approvals for ${requestType} request #${requestId}`);
  });
}

/**
 * Check if deleted user was the only approver for a role and auto-approve if needed
 */
export async function checkAndAutoApproveOrphanedRequests(
  deletedUserId: number
): Promise<string[]> {
  return withConnection(async (conn) => {
    // Find all pending requests where this user was an approver
    const [requests] = await conn.execute<any[]>(
      `SELECT DISTINCT request_type, request_id
       FROM Request_Approvals
       WHERE approver_id = ? AND status = 'pending'`,
      [deletedUserId]
    );

    const affectedRequests: string[] = [];

    for (const req of requests) {
      // Run the auto-approve check procedure
      await conn.execute(
        'CALL SP_Check_Single_Approver_Auto_Approve(?, ?, ?)',
        [deletedUserId, req.request_type, req.request_id]
      );
      affectedRequests.push(`${req.request_type}:${req.request_id}`);
    }

    console.log(`✅ Checked ${affectedRequests.length} requests for auto-approval after user ${deletedUserId} deletion`);
    return affectedRequests;
  });
}

/**
 * Get all stuck requests (mismatched approval counts)
 */
export async function getStuckRequests(): Promise<any[]> {
  return withConnection(async (conn) => {
    try {
      console.log('🔍 Calling SP_Find_Stuck_Requests...');
      const [stuckRequests] = await conn.execute<any[]>(
        'CALL SP_Find_Stuck_Requests()'
      );

      console.log('✅ SP_Find_Stuck_Requests result:', stuckRequests);
      // The procedure returns a result set, so we need to get the first result set
      return Array.isArray(stuckRequests[0]) ? stuckRequests[0] : stuckRequests;
    } catch (error) {
      console.error('❌ Error calling SP_Find_Stuck_Requests:', error);
      throw error;
    }
  });
}

/**
 * Manually fix a stuck request
 */
export async function manuallyFixRequest(
  requestType: 'clearance' | 'onboarding' | 'delegation' | 'direct' | 'certificate' | 'experience' | 'leave' | 'exit' | 'assignment' | 'assignment_termination' | 'internal_transfer',
  requestId: number,
  action: 'recalculate' | 'approve' | 'reset'
): Promise<{ success: boolean; message: string }> {
  return withTransaction(async (conn) => {
    if (action === 'recalculate') {
      // Recalculate approval counts
      await conn.execute(
        'CALL SP_Recalculate_Request_Approvals(?, ?)',
        [requestType, requestId]
      );
      return {
        success: true,
        message: `تم إعادة حساب الاعتمادات للطلب ${requestType}:${requestId}`
      };

    } else if (action === 'approve') {
      // Force approve the request
      const tableName = getRequestTableName(requestType);
      const idColumn = getRequestIdColumn(requestType);

      // Mark all pending approvals as approved
      await conn.execute(
        `UPDATE Request_Approvals
         SET status = 'approved',
             decision_note = 'Manually approved by admin',
             decided_at = NOW()
         WHERE request_type = ? AND request_id = ? AND status = 'pending'`,
        [requestType, requestId]
      );

      // Update the request to approved status
      await conn.execute(
        `UPDATE ${tableName}
         SET status = 'مكتمل',
             final_decision = 'approved',
             approval_stage = 'Fully Approved',
             approved_at = NOW()
         WHERE ${idColumn} = ?`,
        [requestId]
      );

      // Recalculate to update counts
      await conn.execute(
        'CALL SP_Recalculate_Request_Approvals(?, ?)',
        [requestType, requestId]
      );

      return {
        success: true,
        message: `تم اعتماد الطلب ${requestType}:${requestId} يدوياً`
      };

    } else if (action === 'reset') {
      // Reset approval workflow - delete existing approvals and reinitialize
      await conn.execute(
        `DELETE FROM Request_Approvals
         WHERE request_type = ? AND request_id = ?`,
        [requestType, requestId]
      );

      // Reinitialize approvals
      await initializeRequestApprovals(requestType, requestId);

      return {
        success: true,
        message: `تم إعادة تهيئة سير الاعتماد للطلب ${requestType}:${requestId}`
      };

    } else {
      return {
        success: false,
        message: 'إجراء غير صحيح'
      };
    }
  });
}

/**
 * Get approval system health status
 */
export async function getApprovalSystemHealth(): Promise<{
  total_pending: number;
  total_stuck: number;
  stuck_requests: any[];
  status: 'healthy' | 'warning' | 'critical';
}> {
  return withConnection(async (conn) => {
    try {
      console.log('🏥 Getting approval system health...');
      
      // Count total pending requests
      console.log('📊 Counting pending requests...');
      const [pendingCounts] = await conn.execute<any[]>(
        `SELECT 
          (SELECT COUNT(*) FROM Clearance_Requests WHERE final_decision = 'pending') +
          (SELECT COUNT(*) FROM Onboarding_Requests WHERE final_decision = 'pending') +
          (SELECT COUNT(*) FROM Delegation_Requests WHERE final_decision = 'pending') +
          (SELECT COUNT(*) FROM Certificate_Requests WHERE final_decision = 'pending') +
          (SELECT COUNT(*) FROM Experience_Certificate_Requests WHERE final_decision = 'pending') +
          (SELECT COUNT(*) FROM Leave_Requests WHERE final_decision = 'pending') +
          (SELECT COUNT(*) FROM Exit_Requests WHERE final_decision = 'pending') +
          (SELECT COUNT(*) FROM Assignment_Requests WHERE final_decision = 'pending') +
          (SELECT COUNT(*) FROM Assignment_Termination_Requests WHERE final_decision = 'pending') +
          (SELECT COUNT(*) FROM Internal_Transfer_Requests WHERE final_decision = 'pending')
         AS total_pending`
      );

      const totalPending = pendingCounts[0]?.total_pending || 0;
      console.log(`✅ Total pending requests: ${totalPending}`);

      // Get stuck requests
      console.log('🔍 Getting stuck requests...');
      const stuckRequests = await getStuckRequests();
      const totalStuck = stuckRequests.length;
      console.log(`✅ Total stuck requests: ${totalStuck}`);

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (totalStuck > 0) {
        status = totalStuck > 10 ? 'critical' : 'warning';
      }

      console.log(`✅ System status: ${status}`);

      return {
        total_pending: totalPending,
        total_stuck: totalStuck,
        stuck_requests: stuckRequests,
        status
      };
    } catch (error) {
      console.error('❌ Error getting approval system health:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  });
}

