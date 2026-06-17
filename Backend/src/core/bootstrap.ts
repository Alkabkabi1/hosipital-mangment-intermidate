import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { env } from '../config';
import { withConnection } from './database';
import { logger } from './logger';
import { hashPassword } from '../shared/utils/password';

interface UserRecord extends RowDataPacket {
  id: number;
  employee_id: number | null;
}

interface EmployeeRecord extends RowDataPacket {
  employee_id: number;
}

async function ensureAdminRole(conn: PoolConnection): Promise<number> {
  const [roleRows] = await conn.execute<RowDataPacket[]>(
    'SELECT role_id FROM roles WHERE role_name = ? LIMIT 1',
    ['ADMIN']
  );
  const role = roleRows[0] as { role_id: number } | undefined;
  if (role) {
    return role.role_id;
  }

  const [result] = await conn.execute<ResultSetHeader>(
    "INSERT INTO roles (role_name, role_name_ar, description, is_active) VALUES ('ADMIN', 'مدير النظام', 'System administrator with full access', TRUE)"
  );
  return result.insertId;
}

async function ensureEmployee(
  conn: PoolConnection,
  employeeNumber: string,
  name: string,
  departmentCode?: string,
  phone?: string,
  fullNameAr?: string | null,
  position?: string | null,
  email?: string
): Promise<number> {
  const [existingRows] = await conn.execute<EmployeeRecord[]>(
    'SELECT employee_id FROM Employees WHERE employee_number = ? LIMIT 1',
    [employeeNumber]
  );
  const existing = existingRows[0];
  if (existing) {
    return existing.employee_id;
  }

  let departmentId: number | null = null;
  if (departmentCode) {
    const [departmentRows] = await conn.execute<RowDataPacket[]>(
      'SELECT department_id FROM Departments WHERE department_code = ? LIMIT 1',
      [departmentCode]
    );
    const department = departmentRows[0] as { department_id: number } | undefined;
    departmentId = department ? department.department_id : null;
  }

  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] ?? name;
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0] ?? name;

  const [result] = await conn.execute<ResultSetHeader>(
    'INSERT INTO Employees (employee_number, full_name_en, full_name_ar, first_name, last_name, department_id, position, email_work, phone_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      employeeNumber,
      name,
      fullNameAr ?? null,
      firstName,
      lastName,
      departmentId,
      position ?? null,
      email ?? null,
      phone ?? null,
    ]
  );

  return result.insertId;
}

async function attachAdminRole(conn: PoolConnection, userId: number, roleId: number): Promise<void> {
  await conn.execute(
    'INSERT INTO user_roles (user_id, role_id, assigned_by, is_active) VALUES (?, ?, ?, TRUE) ON DUPLICATE KEY UPDATE is_active = TRUE, assigned_by = VALUES(assigned_by)',
    [userId, roleId, userId]
  );
}

async function ensureAdminUser(
  conn: PoolConnection,
  email: string,
  password: string,
  name: string,
  employeeId: number
): Promise<number> {
  const [userRows] = await conn.execute<UserRecord[]>(
    'SELECT id, employee_id FROM App_Users WHERE email = ? LIMIT 1',
    [email]
  );
  const existing = userRows[0];
  if (existing) {
    if (!existing.employee_id) {
      await conn.execute('UPDATE App_Users SET employee_id = ?, updated_at = NOW() WHERE id = ?', [employeeId, existing.id]);
    }
    await conn.execute('UPDATE App_Users SET is_active = TRUE WHERE id = ?', [existing.id]);
    return existing.id;
  }

  const passwordHash = await hashPassword(password);

  const [result] = await conn.execute<ResultSetHeader>(
    "INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active) VALUES (?, ?, ?, 'admin', ?, TRUE)",
    [name, email, passwordHash, employeeId]
  );

  return result.insertId;
}

export async function seedDefaultAdmin(): Promise<void> {
  const email = env.DEFAULT_ADMIN_EMAIL;
  const password = env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    logger.debug('Default admin seeding skipped: DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD not set');
    return;
  }

  const name = env.DEFAULT_ADMIN_NAME ?? 'System Admin';
  const employeeNumber = env.DEFAULT_ADMIN_EMPLOYEE_NUMBER ?? 'ADM-0001';
  const departmentCode = env.DEFAULT_ADMIN_DEPARTMENT_CODE;
  const phone = env.DEFAULT_ADMIN_PHONE;
  const fullNameAr = env.DEFAULT_ADMIN_FULL_NAME_AR ?? null;
  const position = env.DEFAULT_ADMIN_POSITION ?? 'System Administrator';

  await withConnection(async (conn) => {
    const employeeId = await ensureEmployee(
      conn,
      employeeNumber,
      name,
      departmentCode,
      phone,
      fullNameAr,
      position,
      email
    );

    const userId = await ensureAdminUser(conn, email, password, name, employeeId);
    const roleId = await ensureAdminRole(conn);
    await attachAdminRole(conn, userId, roleId);
  });

  logger.info({ email }, 'Default admin account ensured');
}
