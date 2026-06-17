/**
 * Internal Transfer Request (نقل داخلي) - Service Layer
 */

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateInternalTransferInput, UpdateInternalTransferStatusInput } from './internal-transfer.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';

export async function createInternalTransfer(
  userId: number,
  input: CreateInternalTransferInput
) {
  return withConnection(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO Internal_Transfer_Requests 
       (employee_id, employee_name, employee_number, national_id,
        current_department, current_position, current_location, hire_date, years_of_service,
        target_department, target_position, target_location,
        transfer_type, transfer_reason, effective_date, return_date,
        skills_match, training_needed, budget_impact,
        requires_relocation, relocation_support_needed,
        current_manager_approved, target_manager_approved, request_notes,
        status, approval_stage, final_decision)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'Pending Review', 'pending')`,
      [
        userId,
        input.employeeName,
        input.employeeNumber || null,
        input.nationalId || null,
        input.currentDepartment,
        input.currentPosition,
        input.currentLocation || null,
        input.hireDate || null,
        input.yearsOfService || null,
        input.targetDepartment,
        input.targetPosition,
        input.targetLocation || null,
        input.transferType,
        input.transferReason,
        input.effectiveDate,
        input.returnDate || null,
        input.skillsMatch || null,
        input.trainingNeeded || null,
        input.budgetImpact || null,
        input.requiresRelocation || false,
        input.relocationSupportNeeded || false,
        input.currentManagerApproved || false,
        input.targetManagerApproved || false,
        input.requestNotes || null,
      ]
    );

    const transferId = (result as any).insertId;

    await conn.execute(
      `INSERT INTO Internal_Transfer_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, NULL, 'submitted', ?, 'Internal transfer request created')`,
      [transferId, userId]
    );

    try {
      await initializeRequestApprovals('internal_transfer', transferId);
      console.log(`✅ Multi-approval initialized for internal transfer #${transferId}`);
    } catch (error) {
      console.error('Failed to initialize approvals:', error);
    }

    return { id: transferId, message: 'تم تقديم قرار النقل الداخلي بنجاح' };
  });
}

export async function getUserInternalTransfers(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT id, employee_name, current_department, target_department, effective_date,
              status, approval_stage, created_at
       FROM Internal_Transfer_Requests
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  });
}

export async function getInternalTransferById(transferId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT * FROM Internal_Transfer_Requests WHERE id = ?`,
      [transferId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'Internal transfer request not found',
        code: 'NOT_FOUND',
      });
    }

    return rows[0];
  });
}

export async function getAllInternalTransfers() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT it.*, u.email as employee_email
       FROM Internal_Transfer_Requests it
       LEFT JOIN App_Users u ON it.employee_id = u.id
       ORDER BY it.created_at DESC`
    );
    return rows;
  });
}

export async function updateInternalTransferStatus(
  transferId: number,
  input: UpdateInternalTransferStatusInput,
  adminId: number
) {
  return withConnection(async (conn) => {
    await conn.execute(
      `UPDATE Internal_Transfer_Requests
       SET status = ?, admin_notes = ?, rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [input.status, input.adminNotes || null, input.rejectionReason || null, transferId]
    );

    return { success: true };
  });
}

