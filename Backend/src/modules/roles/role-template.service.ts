import type { RowDataPacket } from 'mysql2/promise';

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';

interface RoleTemplateRow extends RowDataPacket {
  template_id: number;
  template_name: string;
  template_name_ar: string;
  description: string | null;
  is_active: number;
  roles: string | null;
  roles_ar: string | null;
  role_count: number;
  created_at: Date;
}

/**
 * Get all active role templates
 */
export async function listRoleTemplates(): Promise<RoleTemplateRow[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<RoleTemplateRow[]>(
      'SELECT * FROM role_template_details WHERE is_active = TRUE ORDER BY template_name'
    );
    return rows;
  });
}

/**
 * Get a specific role template with its roles
 */
export async function getRoleTemplate(templateId: number): Promise<{
  template: RoleTemplateRow;
  roleIds: number[];
}> {
  return withConnection(async (conn) => {
    // Get template details
    const [templateRows] = await conn.execute<RoleTemplateRow[]>(
      'SELECT * FROM role_template_details WHERE template_id = ?',
      [templateId]
    );

    if (templateRows.length === 0) {
      throw new AppError({ statusCode: 404, message: 'Template not found', code: 'NOT_FOUND' });
    }

    // Get role IDs
    const [roleRows] = await conn.execute<RowDataPacket[]>(
      'SELECT role_id FROM role_template_roles WHERE template_id = ?',
      [templateId]
    );

    const roleIds = (roleRows as { role_id: number }[]).map((row) => row.role_id);

    return {
      template: templateRows[0],
      roleIds,
    };
  });
}

/**
 * Apply a template to a user (assign all roles from template)
 * @param templateId - The template to apply
 * @param userId - The user to assign roles to
 * @param assignedBy - The user performing the assignment
 * @param expiresAt - Optional expiration date for all roles
 */
export async function applyTemplateToUser(
  templateId: number,
  userId: number,
  assignedBy: number,
  expiresAt?: Date
): Promise<number> {
  return withConnection(async (conn) => {
    // Verify template exists
    const [templateRows] = await conn.execute<RowDataPacket[]>(
      'SELECT template_id FROM role_templates WHERE template_id = ? AND is_active = TRUE',
      [templateId]
    );

    if (templateRows.length === 0) {
      throw new AppError({ statusCode: 404, message: 'Template not found or inactive', code: 'NOT_FOUND' });
    }

    // Get all roles in this template
    const [roleRows] = await conn.execute<RowDataPacket[]>(
      'SELECT role_id FROM role_template_roles WHERE template_id = ?',
      [templateId]
    );

    if (roleRows.length === 0) {
      throw new AppError({ statusCode: 400, message: 'Template has no roles', code: 'VALIDATION_ERROR' });
    }

    // Insert all roles for user (using ON DUPLICATE KEY to handle existing assignments)
    let assignedCount = 0;
    for (const roleRow of roleRows as { role_id: number }[]) {
      const [result] = await conn.execute(
        `INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at, is_active)
         VALUES (?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE 
           is_active = TRUE, 
           assigned_by = VALUES(assigned_by),
           expires_at = VALUES(expires_at)`,
        [userId, roleRow.role_id, assignedBy, expiresAt || null]
      );

      const resultHeader = result as unknown as { affectedRows: number };
      if (resultHeader.affectedRows > 0) {
        assignedCount++;
      }
    }

    return assignedCount;
  });
}

/**
 * Create a new role template
 */
export async function createRoleTemplate(
  name: string,
  nameAr: string,
  description: string,
  roleIds: number[],
  createdBy: number
): Promise<number> {
  return withConnection(async (conn) => {
    // Insert template
    const [result] = await conn.execute(
      `INSERT INTO role_templates (template_name, template_name_ar, description, created_by)
       VALUES (?, ?, ?, ?)`,
      [name, nameAr, description, createdBy]
    );

    const resultHeader = result as unknown as { insertId: number };
    const templateId = resultHeader.insertId;

    // Insert role mappings
    for (const roleId of roleIds) {
      await conn.execute(
        'INSERT INTO role_template_roles (template_id, role_id) VALUES (?, ?)',
        [templateId, roleId]
      );
    }

    return templateId;
  });
}

/**
 * Update a role template
 */
export async function updateRoleTemplate(
  templateId: number,
  name: string,
  nameAr: string,
  description: string,
  roleIds: number[]
): Promise<void> {
  return withConnection(async (conn) => {
    // Update template
    await conn.execute(
      `UPDATE role_templates 
       SET template_name = ?, template_name_ar = ?, description = ?
       WHERE template_id = ?`,
      [name, nameAr, description, templateId]
    );

    // Delete existing role mappings
    await conn.execute('DELETE FROM role_template_roles WHERE template_id = ?', [templateId]);

    // Insert new role mappings
    for (const roleId of roleIds) {
      await conn.execute(
        'INSERT INTO role_template_roles (template_id, role_id) VALUES (?, ?)',
        [templateId, roleId]
      );
    }
  });
}

/**
 * Delete a role template
 */
export async function deleteRoleTemplate(templateId: number): Promise<void> {
  return withConnection(async (conn) => {
    const [result] = await conn.execute(
      'UPDATE role_templates SET is_active = FALSE WHERE template_id = ?',
      [templateId]
    );

    const resultHeader = result as unknown as { affectedRows: number };
    if (!resultHeader.affectedRows) {
      throw new AppError({ statusCode: 404, message: 'Template not found', code: 'NOT_FOUND' });
    }
  });
}

