/**
 * Assignment Termination Request (إنهاء تكليف) - Service Layer
 */

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateAssignmentTerminationInput, UpdateAssignmentTerminationStatusInput } from './assignment-termination.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';

export async function createAssignmentTermination(
  userId: number,
  input: CreateAssignmentTerminationInput
) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO Assignment_Termination_Requests 
       (employee_id, employee_name, employee_number, national_id,
        original_assignment_id, assignment_role, assignment_department, assignment_start_date,
        termination_reason, termination_date, early_termination,
        return_to_department, return_to_position, return_date,
        assignment_performance, lessons_learned, request_notes,
        status, approval_stage, final_decision)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'Pending Review', 'pending')`,
      [
        userId,
        input.employeeName,
        input.employeeNumber || null,
        input.nationalId || null,
        input.originalAssignmentId || null,
        input.assignmentRole,
        input.assignmentDepartment || null,
        input.assignmentStartDate || null,
        input.terminationReason,
        input.terminationDate,
        input.earlyTermination || false,
        input.returnToDepartment || null,
        input.returnToPosition || null,
        input.returnDate || null,
        input.assignmentPerformance || null,
        input.lessonsLearned || null,
        input.requestNotes || null,
      ]
    );

    const terminationId = (result as any).insertId;

    await conn.execute(
      `INSERT INTO Assignment_Termination_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, NULL, 'submitted', ?, 'Assignment termination request created')`,
      [terminationId, userId]
    );

    try {
      await initializeRequestApprovals('assignment_termination', terminationId);
      console.log(`✅ Multi-approval initialized for assignment termination #${terminationId}`);
    } catch (error) {
      console.error('Failed to initialize approvals:', error);
    }

    return { id: terminationId, message: 'تم تقديم قرار إنهاء التكليف بنجاح' };
  });
}

export async function getUserAssignmentTerminations(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT id, employee_name, assignment_role, termination_date,
              status, approval_stage, created_at
       FROM Assignment_Termination_Requests
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  });
}

export async function getAssignmentTerminationById(terminationId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT * FROM Assignment_Termination_Requests WHERE id = ?`,
      [terminationId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'Assignment termination request not found',
        code: 'NOT_FOUND',
      });
    }

    return rows[0];
  });
}

export async function getAllAssignmentTerminations() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT at.*, u.email as employee_email
       FROM Assignment_Termination_Requests at
       LEFT JOIN App_Users u ON at.employee_id = u.id
       ORDER BY at.created_at DESC`
    );
    return rows;
  });
}

export async function updateAssignmentTerminationStatus(
  terminationId: number,
  input: UpdateAssignmentTerminationStatusInput,
  adminId: number
) {
  return withConnection(async (conn) => {
    await conn.execute(
      `UPDATE Assignment_Termination_Requests
       SET status = ?, admin_notes = ?, rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [input.status, input.adminNotes || null, input.rejectionReason || null, terminationId]
    );

    return { success: true };
  });
}

