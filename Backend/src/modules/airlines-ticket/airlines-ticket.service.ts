import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import type { CreateAirlinesTicketInput, UpdateAirlinesTicketStatusInput } from './airlines-ticket.schema';
import { initializeRequestApprovals } from '../multi-approval/multi-approval.service';

export async function createAirlinesTicket(userId: number, input: CreateAirlinesTicketInput) {
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
      `INSERT INTO Saudi_Airlines_Ticket_Requests 
       (employee_id, employee_name, employee_number,
        request_date, letter_hijri_date, department, contact_number,
        route_origin, route_stop1, route_stop2, route_return, travel_start_date, travel_class,
        passengers, closing_greeting, hr_director_name, additional_notes,
        service_type, status, approval_stage, final_decision, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'Pending Review', 'pending', NOW())`,
      [
        userId, input.employee_name, input.employee_number,
        input.request_date, input.letter_hijri_date || null, input.department, input.contact_number || null,
        input.route_origin, input.route_stop1 || null, input.route_stop2 || null, input.route_return,
        input.travel_start_date, input.travel_class || 'الدرجة السياحية (المخفضة)',
        JSON.stringify(input.passengers),
        input.closing_greeting || 'مع أطيب تحياتي،',
        input.hr_director_name || 'أ / بدر عبيد الله العازمي',
        input.additional_notes || null,
        'خطاب تذاكر سعودية'
      ]
    );

    const requestId = (result as any).insertId;

    await conn.execute(
      `INSERT INTO Saudi_Airlines_Ticket_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, NULL, 'submitted', ?, 'Airlines ticket request created')`,
      [requestId, userId]
    );

    try {
      await initializeRequestApprovals('airlines_ticket', requestId);
    } catch (error) {
      console.error('Failed to initialize approvals:', error);
    }

    return { id: requestId, message: 'تم تقديم طلب تذاكر الطيران بنجاح' };
  });
}

export async function getUserAirlinesTickets(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT id, employee_name, route_origin, route_return, travel_start_date, status, approval_stage, created_at
       FROM Saudi_Airlines_Ticket_Requests
       WHERE employee_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  });
}

export async function getAirlinesTicketById(id: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<any[]>(
      'SELECT * FROM Saudi_Airlines_Ticket_Requests WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      throw new AppError({ statusCode: 404, message: 'الطلب غير موجود', code: 'NOT_FOUND' });
    }
    return rows[0];
  });
}

export async function getAllAirlinesTickets() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT at.*, u.email as employee_email
       FROM Saudi_Airlines_Ticket_Requests at
       LEFT JOIN App_Users u ON at.employee_id = u.id
       ORDER BY at.created_at DESC`
    );
    return rows;
  });
}

export async function updateAirlinesTicketStatus(id: number, input: UpdateAirlinesTicketStatusInput, adminId: number) {
  return withConnection(async (conn) => {
    const [current] = await conn.execute<any[]>(
      'SELECT status FROM Saudi_Airlines_Ticket_Requests WHERE id = ?',
      [id]
    );

    if (current.length === 0) {
      throw new AppError({ statusCode: 404, message: 'الطلب غير موجود', code: 'NOT_FOUND' });
    }

    await conn.execute(
      `UPDATE Saudi_Airlines_Ticket_Requests 
       SET status = ?, admin_notes = ?, rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [input.status, input.admin_notes || null, input.rejection_reason || null, id]
    );

    await conn.execute(
      `INSERT INTO Saudi_Airlines_Ticket_Status_History 
       (request_id, old_status, new_status, changed_by, change_notes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, current[0].status, input.status, adminId, input.admin_notes || `Status changed to ${input.status}`]
    );

    return { message: 'تم تحديث حالة الطلب بنجاح' };
  });
}

