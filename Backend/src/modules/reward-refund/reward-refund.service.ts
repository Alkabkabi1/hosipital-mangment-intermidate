import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateRewardRefundInput, UpdateRewardRefundStatusInput } from './reward-refund.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';

export async function createRewardRefund(userId: number, input: CreateRewardRefundInput) {
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
      `INSERT INTO Reward_Refund_Requests 
       (employee_id, employee_name, employee_number,
        name, nationality, position, contract_type, job_no, work_start, record_no, contract_end, department,
        opt_end_service, opt_vacation_refund, requested_rewards,
        request_date, employee_signature, employee_sign_date,
        employee_decision, hr_decision, non_eligibility_reason,
        service_type, status, approval_stage, final_decision, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'Pending Review', 'pending', NOW())`,
      [
        userId, user.name, user.employee_number,
        input.name, input.nationality, input.position, input.contract_type, input.job_no,
        input.work_start, input.record_no, input.contract_end, input.department,
        input.opt_end_service || false, input.opt_vacation_refund || false,
        JSON.stringify(input.requested_rewards || []),
        input.request_date, input.employee_signature || null, input.employee_sign_date || null,
        input.employee_decision || 'eligible', input.hr_decision || 'eligible',
        input.non_eligibility_reason || null,
        input.contract_type
      ]
    );

    const requestId = (result as any).insertId;

    await conn.execute(
      `INSERT INTO Reward_Refund_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, NULL, 'submitted', ?, 'Reward/refund request created')`,
      [requestId, userId]
    );

    try {
      await initializeRequestApprovals('reward_refund', requestId);
    } catch (error) {
      console.error('Failed to initialize approvals:', error);
    }

    return { id: requestId, message: 'تم تقديم طلب المكافأة/التعويض بنجاح' };
  });
}

export async function getUserRewardRefunds(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT id, name, position, department, request_date, status, approval_stage, created_at
       FROM Reward_Refund_Requests
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  });
}

export async function getRewardRefundById(id: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<any[]>(
      'SELECT * FROM Reward_Refund_Requests WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      throw new AppError({ statusCode: 404, message: 'الطلب غير موجود', code: 'NOT_FOUND' });
    }
    return rows[0];
  });
}

export async function getAllRewardRefunds() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT rr.*, u.email as employee_email
       FROM Reward_Refund_Requests rr
       LEFT JOIN App_Users u ON rr.employee_id = u.id
       ORDER BY rr.created_at DESC`
    );
    return rows;
  });
}

export async function updateRewardRefundStatus(id: number, input: UpdateRewardRefundStatusInput, adminId: number) {
  return withConnection(async (conn) => {
    const [current] = await conn.execute<any[]>(
      'SELECT status FROM Reward_Refund_Requests WHERE id = ?',
      [id]
    );

    if (current.length === 0) {
      throw new AppError({ statusCode: 404, message: 'الطلب غير موجود', code: 'NOT_FOUND' });
    }

    await conn.execute(
      `UPDATE Reward_Refund_Requests 
       SET status = ?, admin_notes = ?, rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [input.status, input.admin_notes || null, input.rejection_reason || null, id]
    );

    await conn.execute(
      `INSERT INTO Reward_Refund_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, current[0].status, input.status, adminId, input.admin_notes || `Status changed to ${input.status}`]
    );

    return { message: 'تم تحديث حالة الطلب بنجاح' };
  });
}

