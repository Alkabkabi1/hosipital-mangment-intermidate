import type { ResultSetHeader, RowDataPacket } from 'mysql2';

import { withConnection } from '../../core/database';
import type { ClearanceForm } from '../../shared/types/workflows';

interface ClearanceRow extends RowDataPacket {
  clearance_id: number;
  employee_id: number;
  reference_number: string;
  request_date: string;
  effective_date: string;
  last_working_day: string | null;
  reason: string | null;
  status_id: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function findEmployeeIdForUser(userId: number): Promise<number | null> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT employee_id FROM App_Users WHERE id = ? LIMIT 1',
      [userId]
    );
    const record = rows[0];
    if (!record || record.employee_id == null) {
      return null;
    }
    return Number(record.employee_id);
  });
}

export async function insertClearanceForm(params: {
  employeeId: number;
  referenceNumber: string;
  requestDate: string;
  effectiveDate: string;
  lastWorkingDay?: string | null;
  reason?: string | null;
  notes?: string | null;
  statusId: number;
}): Promise<number> {
  const {
    employeeId,
    referenceNumber,
    requestDate,
    effectiveDate,
    lastWorkingDay,
    reason,
    notes,
    statusId,
  } = params;

  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Clearance_Requests (
        employee_id,
        reference_number,
        request_date,
        effective_date,
        last_working_day,
        reason,
        status_id,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        referenceNumber,
        requestDate,
        effectiveDate,
        lastWorkingDay ?? null,
        reason ?? null,
        statusId,
        notes ?? null,
      ]
    );
    return result.insertId;
  });
}

function mapClearanceRow(row: ClearanceRow): ClearanceForm {
  return {
    clearanceId: row.clearance_id,
    employeeId: row.employee_id,
    referenceNumber: row.reference_number,
    requestDate: new Date(row.request_date),
    effectiveDate: new Date(row.effective_date),
    lastWorkingDay: row.last_working_day ? new Date(row.last_working_day) : null,
    reason: row.reason,
    statusId: row.status_id,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getClearanceById(clearanceId: number): Promise<ClearanceForm | null> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<ClearanceRow[]>(
      'SELECT * FROM Clearance_Requests WHERE id = ? LIMIT 1',
      [clearanceId]
    );
    const row = rows[0];
    return row ? mapClearanceRow(row) : null;
  });
}

export async function listClearancesByEmployee(employeeId: number): Promise<ClearanceForm[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<ClearanceRow[]>(
      'SELECT * FROM Clearance_Requests WHERE employee_id = ? ORDER BY created_at DESC',
      [employeeId]
    );
    return rows.map(mapClearanceRow);
  });
}

export interface ClearanceWithUserRow extends ClearanceRow {
  employee_name: string | null;
  employee_email: string | null;
  status_name: string | null;
}

export async function listClearancesForAdmin(): Promise<ClearanceWithUserRow[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<ClearanceWithUserRow[]>(
      `SELECT c.*, u.name AS employee_name, u.email AS employee_email, c.status AS status_name
       FROM Clearance_Requests c
       LEFT JOIN App_Users u ON u.employee_id = c.employee_id
       ORDER BY c.created_at DESC`
    );
    return rows;
  });
}

export async function listClearancesForAdminByStatusIds(statusNames: string[]): Promise<ClearanceWithUserRow[]> {
  if (!statusNames.length) {
    return [];
  }
  return withConnection(async (conn) => {
    const placeholders = statusNames.map(() => '?').join(', ');
    const query = `SELECT c.*, u.name AS employee_name, u.email AS employee_email, c.status AS status_name
       FROM Clearance_Requests c
       LEFT JOIN App_Users u ON u.employee_id = c.employee_id
       WHERE c.status IN (` + placeholders + `)
       ORDER BY c.created_at DESC`;
    const [rows] = await conn.execute<ClearanceWithUserRow[]>(query, statusNames);
    return rows;
  });
}

export async function updateClearanceStatus(params: {
  clearanceId: number;
  statusId: number;
  approvedBy: number;
  rejectionReason?: string | null;
}): Promise<void> {
  const { clearanceId, statusId, approvedBy, rejectionReason } = params;
  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE Clearance_Requests
       SET status_id = ?,
           approved_by = ?,
           approved_at = NOW(),
           rejection_reason = ?,
           updated_at = NOW()
       WHERE clearance_id = ?`,
      [statusId, approvedBy, rejectionReason ?? null, clearanceId]
    );

    await conn.execute(
      `INSERT INTO Clearance_Status_History (clearance_id, status_id, updated_by, rejection_reason)
       VALUES (?, ?, ?, ?)` ,
      [clearanceId, statusId, approvedBy, rejectionReason ?? null]
    );
  });
}
