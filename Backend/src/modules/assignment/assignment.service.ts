/**
 * Assignment Request (قرار تكليف) - Service Layer
 */

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateAssignmentInput, UpdateAssignmentStatusInput } from './assignment.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';

/**
 * Create a new assignment request
 */
export async function createAssignment(
  userId: number,
  input: CreateAssignmentInput
) {
  return withConnection(async (conn) => {
    // Create the assignment request
    const [result] = await conn.execute(
      `INSERT INTO Assignment_Requests 
       (employee_id, employee_name, employee_number, national_id,
        current_department, current_position, current_location,
        assignment_type, new_role, new_department, assignment_reason,
        start_date, end_date, expected_duration, additional_benefits,
        financial_impact, requires_relocation, request_notes,
        status, approval_stage, final_decision)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'Pending Review', 'pending')`,
      [
        userId,
        input.employeeName,
        input.employeeNumber || null,
        input.nationalId || null,
        input.currentDepartment || null,
        input.currentPosition || null,
        input.currentLocation || null,
        input.assignmentType,
        input.newRole,
        input.newDepartment || null,
        input.assignmentReason,
        input.startDate,
        input.endDate || null,
        input.expectedDuration || null,
        input.additionalBenefits || null,
        input.financialImpact || null,
        input.requiresRelocation || false,
        input.requestNotes || null,
      ]
    );

    const assignmentId = (result as any).insertId;

    // Add initial status history
    await conn.execute(
      `INSERT INTO Assignment_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, NULL, 'submitted', ?, 'Assignment request created')`,
      [assignmentId, userId]
    );

    // Initialize multi-approval workflow
    try {
      await initializeRequestApprovals('assignment', assignmentId);
      console.log(`✅ Multi-approval initialized for assignment request #${assignmentId}`);
    } catch (error) {
      console.error('Failed to initialize approvals for assignment request:', error);
    }

    console.log(`✅ Assignment request ${assignmentId} created successfully for user ${userId}`);

    return {
      id: assignmentId,
      message: 'تم تقديم قرار التكليف بنجاح',
    };
  });
}

/**
 * Get user's assignment requests
 */
export async function getUserAssignments(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT id, employee_name, new_role, assignment_type, start_date, end_date,
              status, approval_stage, created_at
       FROM Assignment_Requests
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return rows;
  });
}

/**
 * Get assignment request by ID
 */
export async function getAssignmentById(assignmentId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT * FROM Assignment_Requests WHERE id = ?`,
      [assignmentId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'Assignment request not found',
        code: 'NOT_FOUND',
      });
    }

    return rows[0];
  });
}

/**
 * Get all assignment requests (admin only)
 */
export async function getAllAssignments() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT ar.*, u.email as employee_email
       FROM Assignment_Requests ar
       LEFT JOIN App_Users u ON ar.employee_id = u.id
       ORDER BY ar.created_at DESC`
    );

    return rows;
  });
}

/**
 * Update assignment request status
 */
export async function updateAssignmentStatus(
  assignmentId: number,
  input: UpdateAssignmentStatusInput,
  adminId: number
) {
  return withConnection(async (conn) => {
    // Update the request
    await conn.execute(
      `UPDATE Assignment_Requests
       SET status = ?, admin_notes = ?, rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [input.status, input.adminNotes || null, input.rejectionReason || null, assignmentId]
    );

    // Add status history
    await conn.execute(
      `INSERT INTO Assignment_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, (SELECT status FROM Assignment_Requests WHERE id = ? LIMIT 1), ?, ?, ?)`,
      [assignmentId, assignmentId, input.status, adminId, input.adminNotes || null]
    );

    console.log(`✅ Assignment request ${assignmentId} status updated to ${input.status}`);

    return { success: true };
  });
}

