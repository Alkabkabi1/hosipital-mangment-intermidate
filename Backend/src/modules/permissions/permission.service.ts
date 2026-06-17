import type { RowDataPacket } from 'mysql2/promise';

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';

interface PermissionRow extends RowDataPacket {
  permission_id: number;
  permission_name: string;
  resource: string;
  action: string;
  description: string | null;
  is_active: number;
}

interface RolePermissionRow extends RowDataPacket {
  permission_name: string;
  resource: string;
  action: string;
}

/**
 * Fetch all permissions from the database
 */
export async function listAllPermissions(): Promise<PermissionRow[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<PermissionRow[]>(
      `SELECT permission_id, permission_name, resource, action, description, is_active 
       FROM permissions 
       ORDER BY resource, action`
    );
    return rows;
  });
}

/**
 * Fetch all active permissions from the database
 */
export async function listActivePermissions(): Promise<PermissionRow[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<PermissionRow[]>(
      `SELECT permission_id, permission_name, resource, action, description, is_active 
       FROM permissions 
       WHERE is_active = TRUE
       ORDER BY resource, action`
    );
    return rows;
  });
}

/**
 * Fetch permissions for a specific user based on their assigned roles
 * Uses role hierarchy to inherit permissions (e.g., ADMIN gets all permissions)
 * @param userId - The ID of the user
 * @returns Array of permission names the user has access to
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<RolePermissionRow[]>(
      `SELECT DISTINCT p.permission_name, p.resource, p.action
       FROM permissions p
       INNER JOIN role_permissions rp ON rp.permission_id = p.permission_id
       INNER JOIN (
         -- Get user's direct roles
         SELECT ur.role_id
         FROM user_roles ur
         WHERE ur.user_id = ? AND ur.is_active = TRUE
         
         UNION
         
         -- Get inherited roles via hierarchy (e.g., ADMIN inherits from all child roles)
         SELECT rh.child_role_id AS role_id
         FROM user_roles ur
         INNER JOIN role_hierarchy rh ON rh.parent_role_id = ur.role_id
         WHERE ur.user_id = ? AND ur.is_active = TRUE
       ) AS effective_roles ON rp.role_id = effective_roles.role_id
       WHERE p.is_active = TRUE
       ORDER BY p.resource, p.action`,
      [userId, userId]
    );

    return rows.map((row) => row.permission_name);
  });
}

/**
 * Fetch permissions for a specific role
 * @param roleId - The ID of the role
 * @returns Array of permission names assigned to the role
 */
export async function getRolePermissions(roleId: number): Promise<string[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<RolePermissionRow[]>(
      `SELECT p.permission_name, p.resource, p.action
       FROM permissions p
       INNER JOIN role_permissions rp ON rp.permission_id = p.permission_id
       WHERE rp.role_id = ? AND p.is_active = TRUE
       ORDER BY p.resource, p.action`,
      [roleId]
    );

    return rows.map((row) => row.permission_name);
  });
}

/**
 * Fetch detailed permissions for a user including roles and permissions
 * Uses role hierarchy to inherit permissions (e.g., ADMIN gets all permissions)
 * @param userId - The ID of the user
 * @returns Object with roles and permissions arrays
 */
export async function getUserPermissionsDetailed(userId: number): Promise<{
  roles: string[];
  permissions: string[];
}> {
  return withConnection(async (conn) => {
    // Fetch user's active roles (direct assignments only, not inherited)
    const [roleRows] = await conn.execute<RowDataPacket[]>(
      `SELECT DISTINCT r.role_name
       FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.role_id
       WHERE ur.user_id = ? AND ur.is_active = TRUE AND r.is_active = TRUE
       ORDER BY r.role_name`,
      [userId]
    );

    const roles = (roleRows as { role_name: string }[]).map((row) => row.role_name);

    // Fetch user's permissions (including inherited permissions via hierarchy)
    const [permRows] = await conn.execute<RolePermissionRow[]>(
      `SELECT DISTINCT p.permission_name
       FROM permissions p
       INNER JOIN role_permissions rp ON rp.permission_id = p.permission_id
       INNER JOIN (
         -- Get user's direct roles
         SELECT ur.role_id
         FROM user_roles ur
         WHERE ur.user_id = ? AND ur.is_active = TRUE
         
         UNION
         
         -- Get inherited roles via hierarchy (e.g., ADMIN inherits from all child roles)
         SELECT rh.child_role_id AS role_id
         FROM user_roles ur
         INNER JOIN role_hierarchy rh ON rh.parent_role_id = ur.role_id
         WHERE ur.user_id = ? AND ur.is_active = TRUE
       ) AS effective_roles ON rp.role_id = effective_roles.role_id
       WHERE p.is_active = TRUE
       ORDER BY p.permission_name`,
      [userId, userId]
    );

    const permissions = permRows.map((row) => row.permission_name);

    return { roles, permissions };
  });
}

/**
 * Check if a user has a specific permission
 * Uses role hierarchy to check inherited permissions
 * @param userId - The ID of the user
 * @param permissionName - The name of the permission to check
 * @returns Boolean indicating if the user has the permission
 */
export async function userHasPermission(userId: number, permissionName: string): Promise<boolean> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 1
       FROM permissions p
       INNER JOIN role_permissions rp ON rp.permission_id = p.permission_id
       INNER JOIN (
         -- Get user's direct roles
         SELECT ur.role_id
         FROM user_roles ur
         WHERE ur.user_id = ? AND ur.is_active = TRUE
         
         UNION
         
         -- Get inherited roles via hierarchy
         SELECT rh.child_role_id AS role_id
         FROM user_roles ur
         INNER JOIN role_hierarchy rh ON rh.parent_role_id = ur.role_id
         WHERE ur.user_id = ? AND ur.is_active = TRUE
       ) AS effective_roles ON rp.role_id = effective_roles.role_id
       WHERE p.permission_name = ? AND p.is_active = TRUE
       LIMIT 1`,
      [userId, userId, permissionName]
    );

    return rows.length > 0;
  });
}

/**
 * Assign a permission to a role
 * @param roleId - The ID of the role
 * @param permissionId - The ID of the permission
 * @param grantedBy - The ID of the user granting the permission
 */
export async function assignPermissionToRole(
  roleId: number,
  permissionId: number,
  grantedBy: number
): Promise<void> {
  return withConnection(async (conn) => {
    // Verify role exists
    const [roleRows] = await conn.execute<RowDataPacket[]>(
      'SELECT role_id FROM roles WHERE role_id = ? AND is_active = TRUE',
      [roleId]
    );

    if (!roleRows.length) {
      throw new AppError({ statusCode: 404, message: 'Role not found', code: 'NOT_FOUND' });
    }

    // Verify permission exists
    const [permRows] = await conn.execute<RowDataPacket[]>(
      'SELECT permission_id FROM permissions WHERE permission_id = ? AND is_active = TRUE',
      [permissionId]
    );

    if (!permRows.length) {
      throw new AppError({ statusCode: 404, message: 'Permission not found', code: 'NOT_FOUND' });
    }

    // Assign permission to role (ignore if already assigned)
    await conn.execute(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by)
       VALUES (?, ?, ?)`,
      [roleId, permissionId, grantedBy]
    );
  });
}

/**
 * Remove a permission from a role
 * @param roleId - The ID of the role
 * @param permissionId - The ID of the permission
 */
export async function removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
  return withConnection(async (conn) => {
    const [result] = await conn.execute(
      'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
      [roleId, permissionId]
    );

    const resultHeader = result as unknown as { affectedRows: number };
    if (!resultHeader.affectedRows) {
      throw new AppError({
        statusCode: 404,
        message: 'Permission assignment not found',
        code: 'NOT_FOUND',
      });
    }
  });
}

/**
 * Get all permissions grouped by resource
 */
export async function getPermissionsByResource(): Promise<
  Record<string, Array<{ permission_id: number; permission_name: string; action: string; description: string | null }>>
> {
  const permissions = await listActivePermissions();
  const grouped: Record<
    string,
    Array<{ permission_id: number; permission_name: string; action: string; description: string | null }>
  > = {};

  for (const perm of permissions) {
    if (!grouped[perm.resource]) {
      grouped[perm.resource] = [];
    }
    grouped[perm.resource].push({
      permission_id: perm.permission_id,
      permission_name: perm.permission_name,
      action: perm.action,
      description: perm.description,
    });
  }

  return grouped;
}

/**
 * Create a new permission
 * @param data - Permission data (permission_name, resource, action, description)
 * @returns The ID of the newly created permission
 */
export async function createPermission(data: {
  permission_name: string;
  resource: string;
  action: string;
  description?: string;
}): Promise<number> {
  return withConnection(async (conn) => {
    // Check if permission already exists
    const [existing] = await conn.execute<PermissionRow[]>(
      'SELECT permission_id FROM permissions WHERE permission_name = ?',
      [data.permission_name]
    );

    if (existing.length > 0) {
      throw new AppError({
        statusCode: 409,
        message: 'Permission already exists',
        code: 'CONFLICT',
      });
    }

    // Insert new permission
    const [result] = await conn.execute(
      `INSERT INTO permissions (permission_name, resource, action, description, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [data.permission_name, data.resource, data.action, data.description || null]
    );

    const insertResult = result as unknown as { insertId: number };
    return insertResult.insertId;
  });
}

/**
 * Update an existing permission
 * @param permissionId - The ID of the permission to update
 * @param data - Updated permission data
 */
export async function updatePermission(
  permissionId: number,
  data: {
    permission_name?: string;
    resource?: string;
    action?: string;
    description?: string;
    is_active?: boolean;
  }
): Promise<void> {
  return withConnection(async (conn) => {
    // Verify permission exists
    const [existing] = await conn.execute<PermissionRow[]>(
      'SELECT permission_id FROM permissions WHERE permission_id = ?',
      [permissionId]
    );

    if (existing.length === 0) {
      throw new AppError({ statusCode: 404, message: 'Permission not found', code: 'NOT_FOUND' });
    }

    // If updating permission_name, check for duplicates
    if (data.permission_name) {
      const [duplicate] = await conn.execute<PermissionRow[]>(
        'SELECT permission_id FROM permissions WHERE permission_name = ? AND permission_id != ?',
        [data.permission_name, permissionId]
      );

      if (duplicate.length > 0) {
        throw new AppError({
          statusCode: 409,
          message: 'Permission name already exists',
          code: 'CONFLICT',
        });
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | number | boolean)[] = [];

    if (data.permission_name !== undefined) {
      updates.push('permission_name = ?');
      values.push(data.permission_name);
    }
    if (data.resource !== undefined) {
      updates.push('resource = ?');
      values.push(data.resource);
    }
    if (data.action !== undefined) {
      updates.push('action = ?');
      values.push(data.action);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return; // Nothing to update
    }

    values.push(permissionId);

    await conn.execute(`UPDATE permissions SET ${updates.join(', ')} WHERE permission_id = ?`, values);
  });
}

/**
 * Delete a permission (soft delete by setting is_active = FALSE)
 * @param permissionId - The ID of the permission to delete
 */
export async function deletePermission(permissionId: number): Promise<void> {
  return withConnection(async (conn) => {
    // Verify permission exists
    const [existing] = await conn.execute<PermissionRow[]>(
      'SELECT permission_id FROM permissions WHERE permission_id = ?',
      [permissionId]
    );

    if (existing.length === 0) {
      throw new AppError({ statusCode: 404, message: 'Permission not found', code: 'NOT_FOUND' });
    }

    // Soft delete - set is_active = FALSE
    await conn.execute('UPDATE permissions SET is_active = FALSE WHERE permission_id = ?', [permissionId]);

    // Optionally remove all role assignments (or keep for audit trail)
    // For now, we'll keep the assignments but they won't be active since permission is inactive
  });
}

