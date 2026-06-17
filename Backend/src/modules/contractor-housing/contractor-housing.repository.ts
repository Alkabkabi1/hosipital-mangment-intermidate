import { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { CreateContractorHousingDTO } from './contractor-housing.schema';

export class ContractorHousingRepository {
  /**
   * Create a new contractor housing allowance request
   */
  static async create(conn: PoolConnection, employeeId: number, data: CreateContractorHousingDTO) {
    const query = `
      INSERT INTO Contractor_Housing_Requests (
        employee_id, employee_name, employee_job, employee_number, employee_id_number,
        employee_nationality, contract_year_start, contract_year_end, family_members,
        request_date, competent_employee_name, housing_head_name, hr_director_name,
        request_notes, status, approval_stage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 'Pending Review')
    `;

    const [result] = await conn.execute<ResultSetHeader>(query, [
      employeeId,
      data.employeeName,
      data.employeeJob,
      data.employeeNumber,
      data.employeeIdNumber,
      data.employeeNationality,
      data.contractYearStart,
      data.contractYearEnd,
      data.familyMembers || 1,
      data.requestDate,
      data.competentEmployeeName || null,
      data.housingHeadName || null,
      data.hrDirectorName || null,
      data.requestNotes || null,
    ]);

    return result.insertId;
  }

  /**
   * Get all contractor housing requests for admin with pagination
   */
  static async findAll(conn: PoolConnection, limit: number = 50, offset: number = 0) {
    const query = `
      SELECT 
        chr.*,
        au.email as employee_email,
        au.full_name_ar as app_user_full_name
      FROM Contractor_Housing_Requests chr
      LEFT JOIN App_Users au ON chr.employee_id = au.id
      ORDER BY chr.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await conn.execute<RowDataPacket[]>(query, [limit, offset]);
    return rows;
  }

  /**
   * Get contractor housing request by ID
   */
  static async findById(conn: PoolConnection, id: number) {
    const query = `
      SELECT 
        chr.*,
        au.email as employee_email,
        au.full_name_ar as app_user_full_name
      FROM Contractor_Housing_Requests chr
      LEFT JOIN App_Users au ON chr.employee_id = au.id
      WHERE chr.id = ?
    `;

    const [rows] = await conn.execute<RowDataPacket[]>(query, [id]);
    return rows[0] || null;
  }

  /**
   * Get contractor housing requests by employee ID
   */
  static async findByEmployeeId(conn: PoolConnection, employeeId: number) {
    const query = `
      SELECT * FROM Contractor_Housing_Requests
      WHERE employee_id = ?
      ORDER BY created_at DESC
    `;

    const [rows] = await conn.execute<RowDataPacket[]>(query, [employeeId]);
    return rows;
  }

  /**
   * Update contractor housing request status
   */
  static async updateStatus(
    conn: PoolConnection,
    id: number,
    status: string,
    adminId: number,
    adminNotes?: string,
    rejectionReason?: string
  ) {
    const isApproved = status === 'approved' || status === 'موافق عليه';
    const isRejected = status === 'rejected' || status === 'مرفوض';

    const query = `
      UPDATE Contractor_Housing_Requests
      SET 
        status = ?,
        admin_notes = ?,
        rejection_reason = ?,
        approved_by = ?,
        approved_at = ?,
        rejected_by = ?,
        rejected_at = ?,
        final_decision = ?
      WHERE id = ?
    `;

    await conn.execute(query, [
      status,
      adminNotes || null,
      rejectionReason || null,
      isApproved ? adminId : null,
      isApproved ? new Date() : null,
      isRejected ? adminId : null,
      isRejected ? new Date() : null,
      isApproved ? 'approved' : isRejected ? 'rejected' : 'pending',
      id,
    ]);
  }

  /**
   * Delete contractor housing request
   */
  static async delete(conn: PoolConnection, id: number) {
    const query = `DELETE FROM Contractor_Housing_Requests WHERE id = ?`;
    await conn.execute(query, [id]);
  }

  /**
   * Get count of contractor housing requests by status
   */
  static async countByStatus(conn: PoolConnection, status?: string) {
    let query = `SELECT COUNT(*) as count FROM Contractor_Housing_Requests`;
    const params: any[] = [];

    if (status) {
      query += ` WHERE status = ?`;
      params.push(status);
    }

    const [rows] = await conn.execute<RowDataPacket[]>(query, params);
    return rows[0]?.count || 0;
  }
}

