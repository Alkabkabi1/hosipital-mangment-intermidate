import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateTravelOrderInput, UpdateTravelOrderStatusInput } from './travel-order.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';

export async function createTravelOrder(userId: number, input: CreateTravelOrderInput) {
  return withConnection(async (conn) => {
    const [users] = await conn.execute<any[]>(
      'SELECT name, employee_number FROM App_Users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new AppError({ statusCode: 404, message: 'المستخدم غير موجود', code: 'NOT_FOUND' });
    }

    const user = users[0];

    const [result] = await conn.execute(
      `INSERT INTO NonSaudi_Travel_Order_Requests 
       (employee_id, employee_name, employee_number,
        contractor_name, job_title, department, nationality, iqama_number, passport_number,
        contact_number, travel_destination,
        work_start_date, work_end_date, work_duration_days,
        dependents_start_date, dependents_end_date, dependents_duration_days,
        dependents, sponsor_name, sponsor_id, sponsor_commitment,
        sponsor_signature, sponsor_signature_date,
        director_signature, director_notes, checklist,
        hr_officer_name, hr_officer_signature, hr_officer_stamp,
        hr_manager_name, hr_manager_signature, hr_manager_stamp,
        status, approval_stage, final_decision, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
               'submitted', 'Pending Review', 'pending', NOW())`,
      [
        userId, user.name, user.employee_number || input.employee_number,
        input.contractor_name, input.job_title, input.department, input.nationality,
        input.iqama_number, input.passport_number, input.contact_number || null,
        input.travel_destination,
        input.work_start_date, input.work_end_date, input.work_duration_days || null,
        input.dependents_start_date || null, input.dependents_end_date || null,
        input.dependents_duration_days || null,
        JSON.stringify(input.dependents || []),
        input.sponsor_name, input.sponsor_id || null, input.sponsor_commitment || null,
        input.sponsor_signature, input.sponsor_signature_date,
        input.director_signature || null, input.director_notes || null,
        JSON.stringify(input.checklist || {}),
        input.hr_officer_name, input.hr_officer_signature || null, input.hr_officer_stamp || null,
        input.hr_manager_name || null, input.hr_manager_signature || null, input.hr_manager_stamp || null
      ]
    );

    const requestId = (result as any).insertId;

    await conn.execute(
      `INSERT INTO NonSaudi_Travel_Order_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, NULL, 'submitted', ?, 'Travel order request created')`,
      [requestId, userId]
    );

    try {
      await initializeRequestApprovals('travel_order', requestId);
    } catch (error) {
      console.error('Failed to initialize approvals:', error);
    }

    return { id: requestId, message: 'تم تقديم طلب أمر الإركاب بنجاح' };
  });
}

export async function getUserTravelOrders(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT id, contractor_name, travel_destination, work_start_date, status, approval_stage, created_at
       FROM NonSaudi_Travel_Order_Requests
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  });
}

export async function getTravelOrderById(id: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<any[]>(
      'SELECT * FROM NonSaudi_Travel_Order_Requests WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      throw new AppError({ statusCode: 404, message: 'الطلب غير موجود', code: 'NOT_FOUND' });
    }
    return rows[0];
  });
}

export async function getAllTravelOrders() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT tr.*, u.email as employee_email
       FROM NonSaudi_Travel_Order_Requests tr
       LEFT JOIN App_Users u ON tr.employee_id = u.id
       ORDER BY tr.created_at DESC`
    );
    return rows;
  });
}

export async function updateTravelOrderStatus(id: number, input: UpdateTravelOrderStatusInput, adminId: number) {
  return withConnection(async (conn) => {
    const [current] = await conn.execute<any[]>(
      'SELECT status FROM NonSaudi_Travel_Order_Requests WHERE id = ?',
      [id]
    );

    if (current.length === 0) {
      throw new AppError({ statusCode: 404, message: 'الطلب غير موجود', code: 'NOT_FOUND' });
    }

    await conn.execute(
      `UPDATE NonSaudi_Travel_Order_Requests 
       SET status = ?, admin_notes = ?, rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [input.status, input.admin_notes || null, input.rejection_reason || null, id]
    );

    await conn.execute(
      `INSERT INTO NonSaudi_Travel_Order_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, current[0].status, input.status, adminId, input.admin_notes || `Status changed to ${input.status}`]
    );

    return { message: 'تم تحديث حالة الطلب بنجاح' };
  });
}

