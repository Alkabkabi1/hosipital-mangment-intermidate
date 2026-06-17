import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import type { ListAdminUsersQuery } from './admin.schema';

export interface AdminUserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: string | null;
  is_active: number;
  employee_id: number | null;
  created_at: string;
  updated_at: string;
  roles: string | null;
  roles_ar: string | null;
  // Employee fields
  employee_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name_ar?: string | null;
  position?: string | null;
  phone?: string | null;
  national_id?: string | null;
  hire_date?: string | Date | null;
  birth_date?: string | Date | null;
  gender?: string | null;
  nationality?: string | null;
  department_name?: string | null;
}

export async function listAdminUsers(conn: PoolConnection, query: ListAdminUsersQuery): Promise<AdminUserRow[]> {
  const conditions: string[] = [];
  const params: Array<string | number | boolean> = [];

  if (query.search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.role LIKE ? )');
    const like = `%${query.search}%`;
    params.push(like, like, like);
  }

  if (typeof query.isActive === 'boolean') {
    conditions.push('u.is_active = ?');
    params.push(query.isActive ? 1 : 0);
  }

  if (query.role) {
    conditions.push(`EXISTS (
      SELECT 1
      FROM user_roles ur
      INNER JOIN roles r ON r.role_id = ur.role_id
      WHERE ur.user_id = u.id AND ur.is_active = TRUE AND r.role_name = ?
    )`);
    params.push(query.role.toUpperCase());
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await conn.execute<AdminUserRow[]>(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.role,
       u.is_active,
       u.employee_id,
       u.created_at,
       u.updated_at,
       GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles,
       GROUP_CONCAT(r.role_name_ar ORDER BY r.role_name_ar) AS roles_ar,
       -- Employee fields
       e.employee_number,
       e.first_name,
       e.last_name,
       e.full_name_ar,
       e.position,
       e.phone_primary AS phone,
       e.national_id,
       e.hire_date,
       e.birth_date,
       e.gender,
       e.nationality,
       -- Department name from Departments table
       d.name_ar AS department_name
     FROM App_Users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
     LEFT JOIN roles r ON r.role_id = ur.role_id AND r.is_active = TRUE
     LEFT JOIN Employees e ON e.employee_id = u.employee_id
     LEFT JOIN Departments d ON d.department_id = e.department_id
     ${whereClause}
     GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.employee_id, u.created_at, u.updated_at,
              e.employee_number, e.first_name, e.last_name, e.full_name_ar, e.position, 
              e.phone_primary, e.national_id, e.hire_date, e.birth_date, e.gender, e.nationality,
              d.name_ar
     ORDER BY u.created_at DESC`,
    params
  );

  return rows;
}

export async function getAdminUserById(conn: PoolConnection, userId: number): Promise<AdminUserRow | null> {
  const [rows] = await conn.execute<AdminUserRow[]>(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.role,
       u.is_active,
       u.employee_id,
       u.created_at,
       u.updated_at,
       GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles,
       GROUP_CONCAT(r.role_name_ar ORDER BY r.role_name_ar) AS roles_ar,
       -- Employee fields
       e.employee_number,
       e.first_name,
       e.last_name,
       e.full_name_ar,
       e.position,
       e.phone_primary AS phone,
       e.national_id,
       e.hire_date,
       e.birth_date,
       e.gender,
       e.nationality,
       -- Department name from Departments table (not Employees)
       d.name_ar AS department_name
     FROM App_Users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
     LEFT JOIN roles r ON r.role_id = ur.role_id AND r.is_active = TRUE
     LEFT JOIN Employees e ON e.employee_id = u.employee_id
     LEFT JOIN Departments d ON d.department_id = e.department_id
     WHERE u.id = ?
     GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.employee_id, u.created_at, u.updated_at,
              e.employee_number, e.first_name, e.last_name, e.full_name_ar, e.position, 
              e.phone_primary, e.national_id, e.hire_date, e.birth_date, e.gender, e.nationality,
              d.name_ar
     LIMIT 1`,
    [userId]
  );

  return rows[0] ?? null;
}

export async function insertAdminUser(
  conn: PoolConnection,
  payload: {
    name: string;
    email: string;
    passwordHash: string;
    employeeId?: number | null;
    isActive?: boolean;
  }
): Promise<number> {
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO App_Users (name, email, password_hash, role, employee_id, is_active)
     VALUES (?, ?, ?, 'employee', ?, ?)` ,
    [payload.name, payload.email, payload.passwordHash, payload.employeeId ?? null, payload.isActive === false ? 0 : 1]
  );

  return result.insertId;
}

export async function updateAdminUserRecord(
  conn: PoolConnection,
  userId: number,
  payload: {
    name?: string;
    email?: string;
    passwordHash?: string;
    employeeId?: number | null;
    isActive?: boolean;
  }
): Promise<void> {
  const fields: string[] = [];
  const params: Array<string | number | null> = [];

  if (payload.name !== undefined) {
    fields.push('name = ?');
    params.push(payload.name);
  }

  if (payload.email !== undefined) {
    fields.push('email = ?');
    params.push(payload.email);
  }

  if (payload.passwordHash !== undefined) {
    fields.push('password_hash = ?');
    params.push(payload.passwordHash);
  }

  if (payload.employeeId !== undefined) {
    fields.push('employee_id = ?');
    params.push(payload.employeeId);
  }

  if (payload.isActive !== undefined) {
    fields.push('is_active = ?');
    params.push(payload.isActive ? 1 : 0);
  }

  if (!fields.length) {
    return;
  }

  fields.push('updated_at = NOW()');

  params.push(userId);

  await conn.execute(`UPDATE App_Users SET ${fields.join(', ')} WHERE id = ?`, params);
}

export async function deleteAdminUser(conn: PoolConnection, userId: number): Promise<void> {
  await conn.execute('UPDATE App_Users SET is_active = 0, updated_at = NOW() WHERE id = ?', [userId]);
}

export interface RoleRecord extends RowDataPacket {
  role_id: number;
  role_name: string;
  role_name_ar: string;
}

export async function fetchRolesByNames(conn: PoolConnection, roleNames: string[]): Promise<RoleRecord[]> {
  if (!roleNames.length) {
    return [];
  }

  const placeholders = roleNames.map(() => '?').join(', ');
  const [rows] = await conn.execute<RoleRecord[]>(
    `SELECT role_id, role_name, role_name_ar
     FROM roles
     WHERE role_name IN (${placeholders}) AND is_active = TRUE`,
    roleNames
  );

  return rows;
}

export async function replaceUserRoles(
  conn: PoolConnection,
  userId: number,
  roleIds: number[],
  assignedBy: number
): Promise<void> {
  const [existingRows] = await conn.execute<RowDataPacket[]>(
    'SELECT role_id FROM user_roles WHERE user_id = ?',
    [userId]
  );

  const existingRoleIds = new Set((existingRows as { role_id: number }[]).map((row) => Number(row.role_id)));
  const nextRoleIds = new Set(roleIds);

  await conn.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);

  if (roleIds.length) {
    const values = roleIds.map(() => '(?, ?, ?, TRUE)').join(', ');
    const params: Array<number> = [];
    for (const roleId of roleIds) {
      params.push(userId, roleId, assignedBy);
    }

    await conn.execute(
      `INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
       VALUES ${values}`,
      params
    );
  }

  const removedRoles: number[] = [];
  for (const roleId of existingRoleIds) {
    if (!nextRoleIds.has(roleId)) {
      removedRoles.push(roleId);
    }
  }

  const addedRoles: number[] = [];
  for (const roleId of nextRoleIds) {
    if (!existingRoleIds.has(roleId)) {
      addedRoles.push(roleId);
    }
  }

  if (removedRoles.length) {
    const values = removedRoles.map(() => '(?, ?, ?, ?, CURRENT_TIMESTAMP)').join(', ');
    const params: Array<number | string | null> = [];
    for (const roleId of removedRoles) {
      params.push(userId, roleId, assignedBy, 'REMOVED');
    }
    await conn.execute(
      `INSERT INTO role_audit_log (user_id, role_id, performed_by, action, created_at)
       VALUES ${values}`,
      params
    );
  }

  if (addedRoles.length) {
    const values = addedRoles.map(() => '(?, ?, ?, ?, CURRENT_TIMESTAMP)').join(', ');
    const params: Array<number | string | null> = [];
    for (const roleId of addedRoles) {
      params.push(userId, roleId, assignedBy, 'ASSIGNED');
    }
    await conn.execute(
      `INSERT INTO role_audit_log (user_id, role_id, performed_by, action, created_at)
       VALUES ${values}`,
      params
    );
  }
}
