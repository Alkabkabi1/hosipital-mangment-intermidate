/**
 * Exit Request (طلب إنهاء العمل) - Service Layer
 */

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateExitInput, UpdateExitStatusInput } from './exit.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';

/**
 * Create a new exit request
 */
export async function createExit(
  userId: number,
  input: CreateExitInput
) {
  return withConnection(async (conn) => {
    // Create the exit request
    const [result] = await conn.execute(
      `INSERT INTO Exit_Requests 
       (employee_id, employee_name, employee_number, employee_id_number, job_title, 
        department, supervisor_name, mobile_number, email, exit_reasons, 
        work_environment, manager_relationship, coworker_relationship, suggestions,
        status, approval_stage, final_decision)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'Pending Review', 'pending')`,
      [
        userId,
        input.employeeName,
        input.employeeNumber || null,
        input.employeeIdNumber || null,
        input.jobTitle,
        input.department,
        input.supervisorName || null,
        input.mobileNumber || null,
        input.email || null,
        input.exitReasons || null,
        input.workEnvironment || null,
        input.managerRelationship || null,
        input.coworkerRelationship || null,
        input.suggestions || null,
      ]
    );

    const exitId = (result as any).insertId;

    // Add initial status history
    await conn.execute(
      `INSERT INTO Exit_Request_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, NULL, 'submitted', ?, 'Exit request created')`,
      [exitId, userId]
    );

    // Initialize multi-approval workflow
    try {
      await initializeRequestApprovals('exit', exitId);
      console.log(`✅ Multi-approval initialized for exit request #${exitId}`);
    } catch (error) {
      console.error('Failed to initialize approvals for exit request:', error);
      // Don't throw - request is created, approval can be initialized manually
    }

    console.log(`✅ Exit request ${exitId} created successfully for user ${userId}`);

    return {
      id: exitId,
      message: 'تم تقديم طلب إنهاء العمل بنجاح',
    };
  });
}

/**
 * Get user's exit requests
 */
export async function getUserExits(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT 
        id, employee_name, employee_number, job_title, department,
        status, approval_stage, created_at, submitted_at
       FROM Exit_Requests
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return rows;
  });
}

/**
 * Get exit request by ID
 */
export async function getExitById(exitId: number, userId?: number) {
  return withConnection(async (conn) => {
    let query = `
      SELECT * FROM Exit_Requests WHERE id = ?
    `;
    const params: any[] = [exitId];

    // If userId provided, ensure user owns this request
    if (userId !== undefined) {
      query += ' AND employee_id = ?';
      params.push(userId);
    }

    const [rows] = await conn.execute(query, params);

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'طلب إنهاء العمل غير موجود',
      });
    }

    return rows[0];
  });
}

/**
 * Get all exit requests (admin only)
 */
export async function getAllExits() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT 
        id, employee_name, employee_number, job_title, department,
        email, status, approval_stage, created_at, submitted_at
       FROM Exit_Requests
       ORDER BY created_at DESC`
    );

    return rows;
  });
}

/**
 * Update exit request status
 */
export async function updateExitStatus(
  exitId: number,
  input: UpdateExitStatusInput,
  changedBy: number
) {
  return withConnection(async (conn) => {
    // Get current status
    const [currentRows] = await conn.execute(
      'SELECT status FROM Exit_Requests WHERE id = ?',
      [exitId]
    );

    if (!Array.isArray(currentRows) || currentRows.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'طلب إنهاء العمل غير موجود',
      });
    }

    const oldStatus = (currentRows[0] as any).status;

    // Update status
    await conn.execute(
      `UPDATE Exit_Requests 
       SET status = ?, 
           admin_notes = ?,
           rejection_reason = ?,
           approval_stage = ?,
           final_decision = ?,
           ${input.status === 'approved' ? 'approved_at = NOW(), approved_by = ?,' : ''}
           ${input.status === 'rejected' ? 'rejected_at = NOW(), rejected_by = ?,' : ''}
           updated_at = NOW()
       WHERE id = ?`,
      [
        input.status,
        input.adminNotes || null,
        input.rejectionReason || null,
        input.status === 'approved' ? 'Completed' : input.status === 'rejected' ? 'Rejected' : 'Pending Review',
        input.status === 'approved' ? 'approved' : input.status === 'rejected' ? 'rejected' : 'pending',
        ...(input.status === 'approved' || input.status === 'rejected' ? [changedBy] : []),
        exitId,
      ]
    );

    // Add status history
    await conn.execute(
      `INSERT INTO Exit_Request_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        exitId,
        oldStatus,
        input.status,
        changedBy,
        input.adminNotes || input.rejectionReason || 'Status updated',
      ]
    );

    return {
      message: 'تم تحديث حالة الطلب بنجاح',
    };
  });
}

/**
 * Get status history for an exit request
 */
export async function getExitHistory(exitId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT 
        h.history_id, h.old_status, h.new_status, h.change_notes, h.created_at,
        u.email as changed_by_email
       FROM Exit_Request_Status_History h
       LEFT JOIN App_Users u ON h.changed_by = u.id
       WHERE h.request_id = ?
       ORDER BY h.created_at DESC`,
      [exitId]
    );

    return rows;
  });
}

