import type { RowDataPacket } from 'mysql2/promise';

import type { AssignRoleInput, RemoveRoleInput } from './role.schema';
import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import { sendRoleChangeNotification } from '../notifications/role-notification.service';

interface RoleRecord {
  role_id: number;
  role_name: string;
  is_active: number;
}

interface UserRoleRow extends RowDataPacket {
  role_name: string;
  role_name_ar: string | null;
}

export async function listRoles() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      'SELECT role_id, role_name, role_name_ar, description, is_active FROM roles ORDER BY role_name'
    );
    return rows;
  });
}

export async function listUsersWithRoles() {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.is_active,
        GROUP_CONCAT(r.role_name ORDER BY r.role_name) AS roles
      FROM App_Users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
      LEFT JOIN roles r ON r.role_id = ur.role_id AND r.is_active = TRUE
      GROUP BY u.id, u.name, u.email, u.is_active
      ORDER BY u.name`
    );
    return (rows as { id: number; name: string; email: string; is_active: number; roles: string | null }[]).map(
      (row) => ({
        ...row,
        roles: row.roles ? row.roles.split(',') : [],
      })
    );
  });
}

async function findRoleByName(roleName: string): Promise<RoleRecord | null> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute('SELECT role_id, role_name, is_active FROM roles WHERE role_name = ?', [roleName.toUpperCase()]);
    const [role] = rows as RoleRecord[];
    return role ?? null;
  });
}

export async function assignRoleToUser(input: AssignRoleInput, assignedBy: number) {
  const role = await findRoleByName(input.role);
  if (!role || !role.is_active) {
    throw new AppError({ statusCode: 404, message: 'Role not found', code: 'NOT_FOUND' });
  }

  await withConnection(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO user_roles (user_id, role_id, assigned_by, notes, is_active)
       VALUES (?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE is_active = TRUE, assigned_by = VALUES(assigned_by), notes = VALUES(notes)`,
      [input.userId, role.role_id, assignedBy, input.notes ?? null]
    );
    return result;
  });

  await withConnection(async (conn) => {
    await conn.execute(
      `INSERT INTO role_audit_log (user_id, role_id, performed_by, action)
       VALUES (?, ?, ?, 'ASSIGNED')` ,
      [input.userId, role.role_id, assignedBy]
    );
  });

  // Send notification to the user
  try {
    await sendRoleChangeNotification(input.userId, 'ASSIGNED', role.role_name, assignedBy);
  } catch (error) {
    console.warn('Failed to send role change notification:', error);
    // Don't throw - notification failure shouldn't break role assignment
  }
}

export async function removeRoleFromUser(input: RemoveRoleInput, performedBy: number) {
  const role = await findRoleByName(input.role);
  if (!role) {
    throw new AppError({ statusCode: 404, message: 'Role not found', code: 'NOT_FOUND' });
  }

  const [result] = await withConnection(async (conn) => {
    return conn.execute(
      `UPDATE user_roles SET is_active = FALSE WHERE user_id = ? AND role_id = ? AND is_active = TRUE`,
      [input.userId, role.role_id]
    );
  });

  const resultHeader = result as unknown as { affectedRows: number };
  if (!resultHeader.affectedRows) {
    throw new AppError({ statusCode: 404, message: 'Role assignment not found', code: 'NOT_FOUND' });
  }

  await withConnection(async (conn) => {
    await conn.execute(
      `INSERT INTO role_audit_log (user_id, role_id, performed_by, action)
       VALUES (?, ?, ?, 'REMOVED')` ,
      [input.userId, role.role_id, performedBy]
    );
  });

  // Send notification to the user
  try {
    await sendRoleChangeNotification(input.userId, 'REMOVED', role.role_name, performedBy);
  } catch (error) {
    console.warn('Failed to send role change notification:', error);
    // Don't throw - notification failure shouldn't break role removal
  }
}

export async function getUserRoles(userId: number) {
  return withConnection(async (conn) => {
    const [userRows] = await conn.execute('SELECT id FROM App_Users WHERE id = ? LIMIT 1', [userId]);
    if (!Array.isArray(userRows) || !userRows.length) {
      throw new AppError({ statusCode: 404, message: 'User not found', code: 'NOT_FOUND' });
    }

    const [rows] = await conn.execute<UserRoleRow[]>(
      `SELECT r.role_name, r.role_name_ar
       FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.role_id
       WHERE ur.user_id = ? AND ur.is_active = TRUE AND r.is_active = TRUE
       ORDER BY r.role_name`,
      [userId]
    );

    return rows;
  });
}
