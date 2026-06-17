import type { ResultSetHeader, RowDataPacket } from 'mysql2';

import { withConnection } from '../../core/database';
import type { DelegationForm } from '../../shared/types/workflows';
import { presentWorkflowStatus } from '../../shared/utils/status';

interface DelegationRow extends RowDataPacket {
  delegation_id: number;
  employee_id: number;
  reference_number: string;
  request_date: string;
  delegation_type: string;
  start_date: string | null;
  end_date: string | null;
  reason: string | null;
  delegated_to_employee_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapDelegationRow(row: DelegationRow): DelegationForm {
  return {
    delegationId: row.delegation_id,
    employeeId: row.employee_id,
    referenceNumber: row.reference_number,
    requestDate: new Date(row.request_date),
    delegationType: row.delegation_type,
    startDate: row.start_date ? new Date(row.start_date) : null,
    endDate: row.end_date ? new Date(row.end_date) : null,
    reason: row.reason,
    delegatedToEmployeeId: row.delegated_to_employee_id ?? undefined,
    status: presentWorkflowStatus(row.status),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function insertDelegationForm(params: {
  employeeId: number;
  referenceNumber: string;
  requestDate: string;
  delegationType: string;
  startDate?: string | null;
  endDate?: string | null;
  reason?: string | null;
  delegatedToEmployeeId?: number | null;
  status: string;
  notes?: string | null;
}): Promise<number> {
  const {
    employeeId,
    referenceNumber,
    requestDate,
    delegationType,
    startDate,
    endDate,
    reason,
    delegatedToEmployeeId,
    status,
    notes,
  } = params;

  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO delegation_forms (
        employee_id,
        reference_number,
        request_date,
        delegation_type,
        start_date,
        end_date,
        reason,
        delegated_to_employee_id,
        status,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        referenceNumber,
        requestDate,
        delegationType,
        startDate ?? null,
        endDate ?? null,
        reason ?? null,
        delegatedToEmployeeId ?? null,
        status,
        notes ?? null,
      ]
    );
    return result.insertId;
  });
}

export async function getDelegationById(delegationId: number): Promise<DelegationForm | null> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<DelegationRow[]>(
      'SELECT * FROM delegation_forms WHERE delegation_id = ? LIMIT 1',
      [delegationId]
    );
    const row = rows[0];
    return row ? mapDelegationRow(row) : null;
  });
}

export async function listDelegationsByEmployee(employeeId: number): Promise<DelegationForm[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<DelegationRow[]>(
      'SELECT * FROM delegation_forms WHERE employee_id = ? ORDER BY created_at DESC',
      [employeeId]
    );
    return rows.map(mapDelegationRow);
  });
}

export interface DelegationWithUserRow extends DelegationRow {
  employee_name: string | null;
  employee_email: string | null;
}

export async function listDelegationsForAdmin(): Promise<DelegationWithUserRow[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<DelegationWithUserRow[]>(
      `SELECT d.*, u.name AS employee_name, u.email AS employee_email
       FROM delegation_forms d
       LEFT JOIN App_Users u ON u.employee_id = d.employee_id
       ORDER BY d.created_at DESC`
    );
    return rows.map((row) => ({
      ...row,
      status: presentWorkflowStatus(row.status),
    }));
  });
}

export async function listDelegationsForAdminByStatuses(statuses: string[]): Promise<DelegationWithUserRow[]> {
  if (!statuses.length) {
    return [];
  }
  return withConnection(async (conn) => {
    const placeholders = statuses.map(() => '?').join(', ');
    const [rows] = await conn.execute<DelegationWithUserRow[]>(
      `SELECT d.*, u.name AS employee_name, u.email AS employee_email
       FROM delegation_forms d
       LEFT JOIN App_Users u ON u.employee_id = d.employee_id
       WHERE d.status IN (${placeholders})
       ORDER BY d.created_at DESC`,
      statuses
    );
    return rows.map((row) => ({
      ...row,
      status: presentWorkflowStatus(row.status),
    }));
  });
}

export async function updateDelegationStatusRecord(params: {
  delegationId: number;
  status: string;
  updatedBy: number;
  reason?: string | null;
}): Promise<void> {
  const { delegationId, status, updatedBy, reason } = params;
  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE delegation_forms
       SET status = ?,
           updated_at = NOW(),
           notes = COALESCE(?, notes)
       WHERE delegation_id = ?`,
      [status, reason ?? null, delegationId]
    );
    await conn.execute(
      `INSERT INTO DelegationStatuses (delegation_id, status, updated_by, updated_at)
       VALUES (?, ?, ?, NOW())`,
      [delegationId, status, updatedBy]
    );
  });
}
