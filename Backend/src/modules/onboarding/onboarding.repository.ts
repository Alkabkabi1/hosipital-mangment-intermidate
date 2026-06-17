import type { ResultSetHeader, RowDataPacket } from 'mysql2';

import { withConnection } from '../../core/database';
import type { OnboardingForm } from '../../shared/types/workflows';
import { presentWorkflowStatus } from '../../shared/utils/status';
import { toCanonicalStatus } from '../../constants/status';

interface OnboardingRow extends RowDataPacket {
  onboarding_id: number;
  employee_id: number;
  reference_number: string;
  request_date: string;
  start_date: string;
  position: string | null;
  department_id: number | null;
  supervisor_id: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapOnboardingRow(row: OnboardingRow): OnboardingForm {
  return {
    onboardingId: row.onboarding_id,
    employeeId: row.employee_id,
    referenceNumber: row.reference_number,
    requestDate: new Date(row.request_date),
    startDate: new Date(row.start_date),
    positionTitle: row.position ?? undefined,
    departmentId: row.department_id ?? undefined,
    supervisorId: row.supervisor_id ?? undefined,
    status: presentWorkflowStatus(row.status),
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function insertOnboardingForm(params: {
  employeeId: number;
  referenceNumber: string;
  requestDate: string;
  startDate: string;
  positionTitle?: string | null;
  departmentId?: number | null;
  supervisorId?: number | null;
  status: string;
  notes?: string | null;
}): Promise<number> {
  const {
    employeeId,
    referenceNumber,
    requestDate,
    startDate,
    positionTitle,
    departmentId,
    supervisorId,
    status,
    notes,
  } = params;

  return withConnection(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO Onboarding_Requests (
        employee_id,
        reference_number,
        request_date,
        start_date,
        position,
        department_id,
        supervisor_id,
        status,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employeeId,
        referenceNumber,
        requestDate,
        startDate,
        positionTitle ?? null,
        departmentId ?? null,
        supervisorId ?? null,
        toCanonicalStatus(status),
        notes ?? null,
      ]
    );
    return result.insertId;
  });
}

export async function getOnboardingById(onboardingId: number): Promise<OnboardingForm | null> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<OnboardingRow[]>(
      'SELECT * FROM Onboarding_Requests WHERE id = ? LIMIT 1',
      [onboardingId]
    );
    const row = rows[0];
    return row ? mapOnboardingRow(row) : null;
  });
}

export async function listOnboardingsByEmployee(employeeId: number): Promise<OnboardingForm[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<OnboardingRow[]>(
      'SELECT * FROM Onboarding_Requests WHERE employee_id = ? ORDER BY created_at DESC',
      [employeeId]
    );
    return rows.map(mapOnboardingRow);
  });
}

export interface OnboardingWithUserRow extends OnboardingRow {
  employee_name: string | null;
  employee_email: string | null;
  department_name: string | null;
}

export async function listOnboardingsForAdmin(): Promise<OnboardingWithUserRow[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<OnboardingWithUserRow[]>(
      `SELECT o.*, u.name AS employee_name, u.email AS employee_email, o.employee_dept AS department_name
       FROM Onboarding_Requests o
       LEFT JOIN App_Users u ON u.employee_id = o.employee_id
       ORDER BY o.created_at DESC`
    );
    return rows.map((row) => ({
      ...row,
      status: presentWorkflowStatus(row.status),
    }));
  });
}

export async function listOnboardingsForAdminByStatuses(statuses: string[]): Promise<OnboardingWithUserRow[]> {
  if (!statuses.length) {
    return [];
  }
  return withConnection(async (conn) => {
    const placeholders = statuses.map(() => '?').join(', ');
    const [rows] = await conn.execute<OnboardingWithUserRow[]>(
      `SELECT o.*, u.name AS employee_name, u.email AS employee_email, o.employee_dept AS department_name
       FROM Onboarding_Requests o
       LEFT JOIN App_Users u ON u.employee_id = o.employee_id
       WHERE o.status IN (${placeholders})
       ORDER BY o.created_at DESC`,
      statuses
    );
    return rows.map((row) => ({
      ...row,
      status: presentWorkflowStatus(row.status),
    }));
  });
}

export async function updateOnboardingStatusRecord(params: {
  onboardingId: number;
  status: string;
  updatedBy: number;
  notes?: string | null;
}): Promise<void> {
  const { onboardingId, status, updatedBy, notes } = params;
  await withConnection(async (conn) => {
    await conn.execute(
      `UPDATE Onboarding_Requests
       SET status = ?,
           approved_by = ?,
           approved_at = NOW(),
           updated_at = NOW(),
           notes = COALESCE(?, notes)
       WHERE onboarding_id = ?`,
      [toCanonicalStatus(status), updatedBy, notes ?? null, onboardingId]
    );

    await conn.execute(
      `INSERT INTO Onboarding_Status_History (onboarding_id, status, updated_by, notes)
       VALUES (?, ?, ?, ?)` ,
      [onboardingId, toCanonicalStatus(status), updatedBy, notes ?? null]
    );
  });
}
