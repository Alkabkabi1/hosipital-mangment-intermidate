/**
 * Housing Allowance Request (بدل سكن أطباء سعوديين) - Service Layer
 */

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateHousingAllowanceInput, UpdateHousingAllowanceStatusInput } from './housing-allowance.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface HousingAllowanceRequest {
  id?: number;
  employee_id: number;
  employee_name: string;
  employee_number?: string;
  job_title: string;
  department: string;
  nationality: string;
  letter_date: string;
  hijri_date?: string;
  housing_director?: string;
  period_start?: string;
  period_end?: string;
  social_status?: string;
  allowance_reason?: string;
  housing_manager_note?: string;
  finance_note?: string;
  finance_name?: string;
  hr_director?: string;
  employee_notes?: string;
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

interface HousingAllowanceRequestRow extends RowDataPacket {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_number?: string;
  job_title: string;
  department: string;
  nationality: string;
  letter_date: string;
  hijri_date?: string;
  housing_director?: string;
  period_start?: string;
  period_end?: string;
  social_status?: string;
  allowance_reason?: string;
  housing_manager_note?: string;
  finance_note?: string;
  finance_name?: string;
  hr_director?: string;
  employee_notes?: string;
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
 * Create a new housing allowance request
 */
export async function createHousingAllowanceRequest(
  userId: number,
  input: CreateHousingAllowanceInput
) {
  return withConnection(async (conn) => {
    // Create the housing allowance request
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Housing_Allowance_Requests 
       (employee_id, employee_name, employee_number, job_title, department, nationality,
        letter_date, hijri_date, housing_director, period_start, period_end, social_status,
        allowance_reason, housing_manager_note, finance_note, finance_name, hr_director,
        employee_notes, status, approval_stage, final_decision)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'قيد الاعتماد', 'قيد المراجعة', 'pending')`,
      [
        userId,
        input.employeeName,
        input.employeeNumber,
        input.jobTitle,
        input.department,
        input.nationality,
        input.letterDate,
        input.hijriDate || null,
        input.housingDirector || null,
        input.periodStart || null,
        input.periodEnd || null,
        input.socialStatus || null,
        input.allowanceReason || null,
        input.housingManagerNote || null,
        input.financeNote || null,
        input.financeName || null,
        input.hrDirector || null,
        input.employeeNotes || null
      ]
    );

    const requestId = result.insertId;

    // Add initial status history
    await conn.execute(
      `INSERT INTO Housing_Allowance_Status_History 
       (request_id, old_status, new_status, changed_by, change_note)
       VALUES (?, NULL, 'قيد الاعتماد', ?, 'تم إنشاء طلب بدل السكن')`,
      [requestId, userId]
    );

    // Initialize multi-approval workflow (wrap in try-catch like other services do)
    try {
      await initializeRequestApprovals('housing_allowance', requestId);
      console.log(`✅ Multi-approval initialized for housing allowance request #${requestId}`);
    } catch (error) {
      console.error('Failed to initialize approvals for housing allowance request:', error);
      // Don't throw - request is created, approval can be initialized manually
    }

    console.log(`✅ Housing allowance request ${requestId} created successfully for user ${userId}`);

    return { id: requestId };
  });
}

/**
 * Get all housing allowance requests (admin only)
 */
export async function getAllHousingAllowanceRequests() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<HousingAllowanceRequestRow[]>(
      `SELECT * FROM Housing_Allowance_Requests ORDER BY created_at DESC`
    );
    return rows;
  });
}

/**
 * Get housing allowance request by ID
 */
export async function getHousingAllowanceRequestById(id: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<HousingAllowanceRequestRow[]>(
      `SELECT * FROM Housing_Allowance_Requests WHERE id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'طلب بدل السكن غير موجود',
        code: 'HOUSING_ALLOWANCE_NOT_FOUND'
      });
    }
    
    return rows[0];
  });
}

/**
 * Get housing allowance requests by employee ID
 */
export async function getHousingAllowanceRequestsByEmployee(employeeId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<HousingAllowanceRequestRow[]>(
      `SELECT * FROM Housing_Allowance_Requests WHERE employee_id = ? ORDER BY created_at DESC`,
      [employeeId]
    );
    return rows;
  });
}

/**
 * Update housing allowance request status
 */
export async function updateHousingAllowanceRequestStatus(
  requestId: number,
  userId: number,
  input: UpdateHousingAllowanceStatusInput
) {
  return withConnection(async (conn) => {
    // Get current request
    const [currentRows] = await conn.execute<HousingAllowanceRequestRow[]>(
      `SELECT * FROM Housing_Allowance_Requests WHERE id = ?`,
      [requestId]
    );

    if (currentRows.length === 0) {
      throw new AppError({
        statusCode: 404,
        message: 'طلب بدل السكن غير موجود',
        code: 'HOUSING_ALLOWANCE_NOT_FOUND'
      });
    }

    const currentRequest = currentRows[0];

    // Update the request
    await conn.execute(
      `UPDATE Housing_Allowance_Requests 
       SET status = ?, admin_notes = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [input.status, input.adminNotes || null, input.rejectionReason || null, requestId]
    );

    // Add status history
    await conn.execute(
      `INSERT INTO Housing_Allowance_Status_History 
       (request_id, old_status, new_status, changed_by, change_note)
       VALUES (?, ?, ?, ?, ?)`,
      [requestId, currentRequest.status, input.status, userId, input.adminNotes || 'Status updated']
    );

    console.log(`✅ Housing allowance request ${requestId} status updated to ${input.status} by user ${userId}`);

    return { success: true };
  });
}
