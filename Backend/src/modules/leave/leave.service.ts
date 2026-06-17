import { withConnection } from '../../core/database';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { AppError } from '../../core/errors';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';

export interface LeaveRequest {
  id?: number;
  employee_id: number;
  employee_name: string;
  employee_number?: string;
  employee_id_number?: string;
  job_title: string;
  appointment_date?: string;
  job_type: 'civil' | 'self';
  leave_types: string[]; // JSON array
  request_type: 'new' | 'extension';
  leave_duration: string;
  leave_from_date: string;
  leave_to_date: string;
  previous_leave_duration?: string;
  leave_reasons: string;
  employee_signature_name: string;
  employee_signature: string;
  request_date: string;
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

interface LeaveRequestRow extends RowDataPacket {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_number?: string;
  employee_id_number?: string;
  job_title: string;
  appointment_date?: string;
  job_type: 'civil' | 'self';
  leave_types: string; // JSON string from DB
  request_type: 'new' | 'extension';
  leave_duration: string;
  leave_from_date: string;
  leave_to_date: string;
  previous_leave_duration?: string;
  leave_reasons: string;
  employee_signature_name: string;
  employee_signature: string;
  request_date: string;
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

// Create a new leave request
export async function createLeaveRequest(request: LeaveRequest) {
  return withConnection(async (conn) => {
    const leaveTypesJson = JSON.stringify(request.leave_types);
    
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Leave_Requests (
        employee_id, employee_name, employee_number, employee_id_number, job_title,
        appointment_date, job_type, leave_types, request_type, leave_duration,
        leave_from_date, leave_to_date, previous_leave_duration, leave_reasons,
        employee_signature_name, employee_signature, request_date, status, approval_stage, final_decision
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'Pending Review', 'pending')`,
      [
        request.employee_id,
        request.employee_name,
        request.employee_number || null,
        request.employee_id_number || null,
        request.job_title,
        request.appointment_date || null,
        request.job_type,
        leaveTypesJson,
        request.request_type,
        request.leave_duration,
        request.leave_from_date,
        request.leave_to_date,
        request.previous_leave_duration || null,
        request.leave_reasons,
        request.employee_signature_name,
        request.employee_signature,
        request.request_date
      ]
    );

    const leaveId = result.insertId;

    // Initialize multi-approval workflow
    try {
      await initializeRequestApprovals('leave', leaveId);
      console.log(`✅ Multi-approval initialized for leave request #${leaveId}`);
    } catch (error) {
      console.error('Failed to initialize approvals for leave request:', error);
      // Don't throw - request is created, approval can be initialized manually
    }

    console.log(`✅ Leave request ${leaveId} created successfully for user ${request.employee_id}`);

    return { id: leaveId };
  });
}

// Get all leave requests (for admin)
export async function getAllLeaveRequests() {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<LeaveRequestRow[]>(
      `SELECT * FROM Leave_Requests ORDER BY created_at DESC`
    );
    
    // Parse JSON leave_types
    return rows.map(row => ({
      ...row,
      leave_types: typeof row.leave_types === 'string' ? JSON.parse(row.leave_types) : row.leave_types
    }));
  });
}

// Get leave requests by employee
export async function getLeaveRequestsByEmployee(employeeId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<LeaveRequestRow[]>(
      `SELECT * FROM Leave_Requests WHERE employee_id = ? ORDER BY created_at DESC`,
      [employeeId]
    );
    
    // Parse JSON leave_types
    return rows.map(row => ({
      ...row,
      leave_types: typeof row.leave_types === 'string' ? JSON.parse(row.leave_types) : row.leave_types
    }));
  });
}

// Get a single leave request by ID
export async function getLeaveRequestById(requestId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<LeaveRequestRow[]>(
      `SELECT * FROM Leave_Requests WHERE id = ?`,
      [requestId]
    );
    
    if (rows.length === 0) {
      throw new AppError({ statusCode: 404, message: 'Leave request not found', code: 'NOT_FOUND' });
    }
    
    const row = rows[0];
    return {
      ...row,
      leave_types: typeof row.leave_types === 'string' ? JSON.parse(row.leave_types) : row.leave_types
    };
  });
}

// Update leave request status
export async function updateLeaveRequestStatus(
  requestId: number,
  status: string,
  userId: number,
  notes?: string
) {
  return withConnection(async (conn) => {
    // Get current status for history
    const [current] = await conn.query<LeaveRequestRow[]>(
      `SELECT status FROM Leave_Requests WHERE id = ?`,
      [requestId]
    );
    
    if (current.length === 0) {
      throw new AppError({ statusCode: 404, message: 'Leave request not found', code: 'NOT_FOUND' });
    }
    
    const oldStatus = current[0].status;
    
    // Update status
    await conn.execute(
      `UPDATE Leave_Requests SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, requestId]
    );
    
    // Add to status history
    await conn.execute(
      `INSERT INTO Leave_Request_Status_History (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, ?, ?, ?, ?)`,
      [requestId, oldStatus, status, userId, notes || null]
    );
    
    return { success: true };
  });
}

// Approve leave request
export async function approveLeaveRequest(requestId: number, userId: number, notes?: string) {
  return withConnection(async (conn) => {
    await conn.execute(
      `UPDATE Leave_Requests 
       SET status = 'approved', approved_by = ?, approved_at = NOW(), admin_notes = ?
       WHERE id = ?`,
      [userId, notes || null, requestId]
    );
    
    // Add to history
    await updateLeaveRequestStatus(requestId, 'approved', userId, notes);
    
    return { success: true };
  });
}

// Reject leave request
export async function rejectLeaveRequest(requestId: number, userId: number, reason?: string) {
  return withConnection(async (conn) => {
    await conn.execute(
      `UPDATE Leave_Requests 
       SET status = 'rejected', rejected_by = ?, rejected_at = NOW(), rejection_reason = ?
       WHERE id = ?`,
      [userId, reason || null, requestId]
    );
    
    // Add to history
    await updateLeaveRequestStatus(requestId, 'rejected', userId, reason);
    
    return { success: true };
  });
}

// Add comment to leave request
export async function addLeaveRequestComment(requestId: number, userId: number, comment: string) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Leave_Request_Comments (request_id, user_id, comment) VALUES (?, ?, ?)`,
      [requestId, userId, comment]
    );
    
    return { id: result.insertId };
  });
}

// Get comments for a leave request
export async function getLeaveRequestComments(requestId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT c.*, u.name as user_name, u.email as user_email
       FROM Leave_Request_Comments c
       JOIN App_Users u ON c.user_id = u.id
       WHERE c.request_id = ?
       ORDER BY c.created_at ASC`,
      [requestId]
    );
    
    return rows;
  });
}

// Get status history for a leave request
export async function getLeaveRequestHistory(requestId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT h.*, u.name as changed_by_name
       FROM Leave_Request_Status_History h
       JOIN App_Users u ON h.changed_by = u.id
       WHERE h.request_id = ?
       ORDER BY h.changed_at ASC`,
      [requestId]
    );
    
    return rows;
  });
}

// Delete leave request (soft delete by setting status)
export async function deleteLeaveRequest(requestId: number, userId: number) {
  return withConnection(async (conn) => {
    await conn.execute(
      `UPDATE Leave_Requests SET status = 'cancelled' WHERE id = ?`,
      [requestId]
    );
    
    await updateLeaveRequestStatus(requestId, 'cancelled', userId, 'Request cancelled by user');
    
    return { success: true };
  });
}

