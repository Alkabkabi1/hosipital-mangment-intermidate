/**
 * Maternity Leave Request (طلب إجازة رعاية مولود) - Service Layer
 */

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateMaternityLeaveInput, UpdateMaternityLeaveStatusInput } from './maternity-leave.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface MaternityLeaveRequest {
  id?: number;
  employee_id: number;
  employee_name: string;
  job_title: string;
  employee_id_number?: string;
  service_type: string;
  department: string;
  appointment_date?: string;
  request_type: 'new' | 'extension';
  leave_from_date: string;
  leave_to_date: string;
  leave_duration: number;
  employee_signature?: string;
  pledge_date?: string;
  approval_option: 'approve' | 'defer';
  defer_period?: string;
  manager_name?: string;
  manager_signature?: string;
  attach_birth_notice_name?: string;
  attach_birth_cert_name?: string;
  status?: string;
  approval_stage?: string;
  total_approvers?: number;
  approved_count?: number;
  final_decision?: string;
  request_notes?: string;
  admin_notes?: string;
  rejection_reason?: string;
  approved_by?: number;
  approved_at?: string;
  rejected_by?: number;
  rejected_at?: string;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
}

interface MaternityLeaveRequestRow extends RowDataPacket {
  id: number;
  employee_id: number;
  employee_name: string;
  job_title: string;
  employee_id_number?: string;
  service_type: string;
  department: string;
  appointment_date?: string;
  request_type: 'new' | 'extension';
  leave_from_date: string;
  leave_to_date: string;
  leave_duration: number;
  employee_signature?: string;
  pledge_date?: string;
  approval_option: 'approve' | 'defer';
  defer_period?: string;
  manager_name?: string;
  manager_signature?: string;
  attach_birth_notice_name?: string;
  attach_birth_cert_name?: string;
  status: string;
  approval_stage?: string;
  total_approvers?: number;
  approved_count?: number;
  final_decision?: string;
  request_notes?: string;
  admin_notes?: string;
  rejection_reason?: string;
  approved_by?: number;
  approved_at?: string;
  rejected_by?: number;
  rejected_at?: string;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
}

/**
 * Create a new maternity leave request
 */
export async function createMaternityLeaveRequest(
  userId: number,
  input: CreateMaternityLeaveInput
) {
  return withConnection(async (conn) => {
    // Create the maternity leave request
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Maternity_Leave_Requests 
       (employee_id, employee_name, job_title, employee_id_number, service_type, department,
        appointment_date, request_type, leave_from_date, leave_to_date, leave_duration,
        employee_signature, pledge_date, approval_option, defer_period, manager_name, manager_signature,
        attach_birth_notice_name, attach_birth_cert_name, status, approval_stage, final_decision)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'Pending Review', 'pending')`,
      [
        userId,
        input.employeeName,
        input.jobTitle,
        input.employeeId,
        input.serviceType,
        input.department,
        input.appointmentDate || null,
        input.requestType,
        input.leaveFromDate,
        input.leaveToDate,
        input.leaveDuration,
        input.employeeSignature || null,
        input.pledgeDate || null,
        input.approvalOption,
        input.deferPeriod || null,
        input.managerName || null,
        input.managerSignature || null,
        input.attachBirthNoticeName || null,
        input.attachBirthCertName || null
      ]
    );

    const requestId = result.insertId;

    // Add initial status history
    await conn.execute(
      `INSERT INTO Maternity_Leave_Status_History 
       (request_id, old_status, new_status, changed_by, change_note)
       VALUES (?, NULL, 'submitted', ?, 'Maternity leave request created')`,
      [requestId, userId]
    );

    // Initialize multi-approval workflow (wrap in try-catch like other services do)
    try {
      await initializeRequestApprovals('maternity_leave', requestId);
      console.log(`✅ Multi-approval initialized for maternity leave request #${requestId}`);
    } catch (error) {
      console.error('Failed to initialize approvals for maternity leave request:', error);
      // Don't throw - request is created, approval can be initialized manually
    }

    console.log(`✅ Maternity leave request ${requestId} created successfully for user ${userId}`);

    return { id: requestId };
  });
}

/**
 * Get all maternity leave requests (admin only)
 */
export async function getAllMaternityLeaveRequests() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<MaternityLeaveRequestRow[]>(
      `SELECT * FROM Maternity_Leave_Requests ORDER BY created_at DESC`
    );
    return rows;
  });
}

/**
 * Get maternity leave request by ID
 */
export async function getMaternityLeaveRequestById(id: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<MaternityLeaveRequestRow[]>(
      `SELECT * FROM Maternity_Leave_Requests WHERE id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'طلب إجازة الأمومة غير موجود',
        code: 'MATERNITY_LEAVE_NOT_FOUND'
      });
    }
    
    return rows[0];
  });
}

/**
 * Get maternity leave requests by employee ID
 */
export async function getMaternityLeaveRequestsByEmployee(employeeId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<MaternityLeaveRequestRow[]>(
      `SELECT * FROM Maternity_Leave_Requests WHERE employee_id = ? ORDER BY created_at DESC`,
      [employeeId]
    );
    return rows;
  });
}

/**
 * Update maternity leave request status
 */
export async function updateMaternityLeaveRequestStatus(
  requestId: number,
  userId: number,
  input: UpdateMaternityLeaveStatusInput
) {
  return withConnection(async (conn) => {
    // Get current request
    const [currentRows] = await conn.execute<MaternityLeaveRequestRow[]>(
      `SELECT * FROM Maternity_Leave_Requests WHERE id = ?`,
      [requestId]
    );

    if (currentRows.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'طلب إجازة الأمومة غير موجود',
        code: 'MATERNITY_LEAVE_NOT_FOUND'
      });
    }

    const currentRequest = currentRows[0];

    // Update the request
    await conn.execute(
      `UPDATE Maternity_Leave_Requests 
       SET status = ?, admin_notes = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [input.status, input.adminNotes || null, input.rejectionReason || null, requestId]
    );

    // Add status history
    await conn.execute(
      `INSERT INTO Maternity_Leave_Status_History 
       (request_id, old_status, new_status, changed_by, change_note)
       VALUES (?, ?, ?, ?, ?)`,
      [requestId, currentRequest.status, input.status, userId, input.adminNotes || 'Status updated']
    );

    console.log(`✅ Maternity leave request ${requestId} status updated to ${input.status} by user ${userId}`);

    return { success: true };
  });
}
