import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';
import { hashPassword } from '../../shared/utils/password';
import {
  deleteAdminUser,
  fetchRolesByNames,
  getAdminUserById,
  insertAdminUser,
  listAdminUsers,
  replaceUserRoles,
  updateAdminUserRecord,
  type AdminUserRow,
} from './admin.repository';
import type { CreateAdminUserInput, ListAdminUsersQuery, UpdateAdminUserInput } from './admin.schema';

interface AdminUserResponse {
  id: number;
  name: string;
  email: string;
  role: string | null;
  roles: string[];
  rolesAr: string[];
  employeeId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Employee fields
  employee_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name_ar?: string | null;
  position?: string | null;
  phone?: string | null;
  national_id?: string | null;
  hire_date?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  nationality?: string | null;
  department_name?: string | null;
}

const mapAdminUser = (row: AdminUserRow): AdminUserResponse => {
  const roles = row.roles ? row.roles.split(',').filter(Boolean) : [];
  const rolesAr = row.roles_ar ? row.roles_ar.split(',').filter(Boolean) : [];

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    roles,
    rolesAr,
    employeeId: row.employee_id,
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    // Employee fields
    employee_number: row.employee_number ?? null,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    full_name_ar: row.full_name_ar ?? null,
    position: row.position ?? null,
    phone: row.phone ?? null,
    national_id: row.national_id ?? null,
    hire_date: row.hire_date ? (typeof row.hire_date === 'string' ? row.hire_date : new Date(row.hire_date).toISOString()) : null,
    birth_date: row.birth_date ? (typeof row.birth_date === 'string' ? row.birth_date : new Date(row.birth_date).toISOString()) : null,
    gender: row.gender ?? null,
    nationality: row.nationality ?? null,
    department_name: row.department_name ?? null,
  };
};

const normalizeRoles = (roles?: string[]): string[] => {
  if (!roles || !roles.length) {
    return [];
  }
  const normalized = roles.map((role) => role.trim().toUpperCase()).filter(Boolean);
  return Array.from(new Set(normalized));
};

export async function adminListUsers(query: ListAdminUsersQuery): Promise<AdminUserResponse[]> {
  return withConnection(async (conn) => {
    const rows = await listAdminUsers(conn, query);
    return rows.map(mapAdminUser);
  });
}

export async function adminGetUser(userId: number): Promise<AdminUserResponse> {
  return withConnection(async (conn) => {
    const user = await getAdminUserById(conn, userId);
    if (!user) {
      throw new AppError({ statusCode: 404, message: 'User not found', code: 'NOT_FOUND' });
    }
    return mapAdminUser(user);
  });
}

export async function adminCreateUser(input: CreateAdminUserInput, adminUserId: number): Promise<AdminUserResponse> {
  const roles = normalizeRoles(input.roles);

  return withConnection(async (conn) => {
    await conn.beginTransaction();
    try {
      const [existingRows] = await conn.execute('SELECT id FROM App_Users WHERE email = ? LIMIT 1', [input.email]);
      if (Array.isArray(existingRows) && existingRows.length) {
        throw new AppError({ statusCode: 409, message: 'Email already in use', code: 'CONFLICT' });
      }

      const passwordHash = await hashPassword(input.password);
      const userId = await insertAdminUser(conn, {
        name: input.name,
        email: input.email,
        passwordHash,
        employeeId: input.employeeId ?? null,
        isActive: input.isActive ?? true,
      });

      let rolesToAssign = roles;
      if (!rolesToAssign.length) {
        rolesToAssign = ['EMPLOYEE'];
      }

      const roleRecords = await fetchRolesByNames(conn, rolesToAssign);
      if (roleRecords.length !== rolesToAssign.length) {
        throw new AppError({ statusCode: 400, message: 'One or more roles are invalid', code: 'BAD_REQUEST' });
      }

      const roleIds = roleRecords.map((record) => record.role_id);
      await replaceUserRoles(conn, userId, roleIds, adminUserId);

      await conn.commit();

      const created = await getAdminUserById(conn, userId);
      if (!created) {
        throw new AppError({ statusCode: 500, message: 'Failed to load created user', code: 'INTERNAL_SERVER_ERROR' });
      }
      return mapAdminUser(created);
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  });
}

export async function adminUpdateUser(
  userId: number,
  input: UpdateAdminUserInput,
  adminUserId: number
): Promise<AdminUserResponse> {
  const roles = input.roles !== undefined ? normalizeRoles(input.roles) : undefined;

  return withConnection(async (conn) => {
    await conn.beginTransaction();
    try {
      const existing = await getAdminUserById(conn, userId);
      if (!existing) {
        throw new AppError({ statusCode: 404, message: 'User not found', code: 'NOT_FOUND' });
      }

      if (input.email && input.email !== existing.email) {
        const [emailRows] = await conn.execute('SELECT id FROM App_Users WHERE email = ? AND id <> ? LIMIT 1', [input.email, userId]);
        if (Array.isArray(emailRows) && emailRows.length) {
          throw new AppError({ statusCode: 409, message: 'Email already in use', code: 'CONFLICT' });
        }
      }

      let passwordHash: string | undefined;
      if (input.password) {
        passwordHash = await hashPassword(input.password);
      }

      const employeeIdField = Object.prototype.hasOwnProperty.call(input, 'employeeId')
        ? input.employeeId ?? null
        : undefined;

      await updateAdminUserRecord(conn, userId, {
        name: input.name,
        email: input.email,
        passwordHash,
        employeeId: employeeIdField,
        isActive: input.isActive,
      });

      if (roles !== undefined) {
        const roleRecords = await fetchRolesByNames(conn, roles);
        if (roleRecords.length !== roles.length) {
          throw new AppError({ statusCode: 400, message: 'One or more roles are invalid', code: 'BAD_REQUEST' });
        }
        const roleIds = roleRecords.map((record) => record.role_id);
        await replaceUserRoles(conn, userId, roleIds, adminUserId);
      }

      await conn.commit();

      const updated = await getAdminUserById(conn, userId);
      if (!updated) {
        throw new AppError({ statusCode: 404, message: 'User not found', code: 'NOT_FOUND' });
      }
      return mapAdminUser(updated);
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  });
}

export async function adminDeleteUser(userId: number): Promise<void> {
  await withConnection(async (conn) => {
    const existing = await getAdminUserById(conn, userId);
    if (!existing) {
      throw new AppError({ statusCode: 404, message: 'User not found', code: 'NOT_FOUND' });
    }
    await deleteAdminUser(conn, userId);
  });
}

/**
 * Get all privileged users (with approval rights) and request type permissions
 */
export async function getPrivilegedUsersOverview(): Promise<any> {
  return withConnection(async (conn) => {
    // Get all users with privileged roles (ADMIN, MANAGER, HR, FINANCE, IT)
    const [privilegedUsers] = await conn.execute<any[]>(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.is_active,
        GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name) AS roles,
        GROUP_CONCAT(DISTINCT r.role_name_ar ORDER BY r.role_name_ar) AS roles_ar,
        e.position,
        e.full_name_ar,
        d.name_ar AS department_name
      FROM App_Users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
      LEFT JOIN roles r ON r.role_id = ur.role_id AND r.is_active = TRUE
      LEFT JOIN Employees e ON e.employee_id = u.employee_id
      LEFT JOIN Departments d ON d.department_id = e.department_id
      WHERE r.role_name IN ('ADMIN', 'MANAGER', 'HR', 'FINANCE', 'IT')
        AND u.is_active = TRUE
      GROUP BY u.id, u.name, u.email, u.is_active, e.position, e.full_name_ar, d.name_ar
      ORDER BY 
        CASE 
          WHEN FIND_IN_SET('ADMIN', GROUP_CONCAT(DISTINCT r.role_name)) > 0 THEN 1
          WHEN FIND_IN_SET('MANAGER', GROUP_CONCAT(DISTINCT r.role_name)) > 0 THEN 2
          WHEN FIND_IN_SET('HR', GROUP_CONCAT(DISTINCT r.role_name)) > 0 THEN 3
          WHEN FIND_IN_SET('FINANCE', GROUP_CONCAT(DISTINCT r.role_name)) > 0 THEN 4
          WHEN FIND_IN_SET('IT', GROUP_CONCAT(DISTINCT r.role_name)) > 0 THEN 5
          ELSE 6
        END,
        u.name`
    );

    // Get active commissioners (temporary delegated access)
    const [commissioners] = await conn.execute<any[]>(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.is_active,
        'COMMISSIONER' AS roles,
        'مفوض' AS roles_ar,
        e.position,
        e.full_name_ar,
        d.name_ar AS department_name,
        dr.start_date,
        dr.end_date,
        dr.reason
      FROM Delegation_Requests dr
      INNER JOIN App_Users u ON u.email = dr.to_email
      LEFT JOIN Employees e ON e.employee_id = u.employee_id
      LEFT JOIN Departments d ON d.department_id = e.department_id
      WHERE dr.status = 'approved'
        AND dr.start_date <= NOW()
        AND (dr.end_date IS NULL OR dr.end_date >= NOW())
        AND u.is_active = TRUE
      ORDER BY u.name`
    );

    // Get approval rules for each request type
    const [approvalRules] = await conn.execute<any[]>(
      `SELECT 
        ar.request_type,
        r.role_name,
        r.role_name_ar,
        ar.approval_order,
        ar.is_required
      FROM Approval_Rules ar
      INNER JOIN roles r ON r.role_name = ar.role_name
      WHERE ar.is_active = TRUE
      ORDER BY ar.request_type, ar.approval_order`
    );

    // Define request types with Arabic names
    const requestTypes = [
      { type: 'clearance', nameAr: 'إخلاء طرف', nameEn: 'Clearance' },
      { type: 'direct', nameAr: 'مباشرة عمل', nameEn: 'Onboarding' },
      { type: 'delegation', nameAr: 'تفويض', nameEn: 'Delegation' },
      { type: 'certificate', nameAr: 'شهادة تعريف', nameEn: 'Certificate' },
      { type: 'experience', nameAr: 'شهادة خبرة', nameEn: 'Experience Certificate' },
      { type: 'leave', nameAr: 'إجازة', nameEn: 'Leave Request' },
      { type: 'exit', nameAr: 'إنهاء عمل', nameEn: 'Exit Request' },
      { type: 'assignment', nameAr: 'تكليف', nameEn: 'Assignment' },
      { type: 'assignment_termination', nameAr: 'إنهاء تكليف', nameEn: 'Assignment Termination' },
      { type: 'internal_transfer', nameAr: 'نقل داخلي', nameEn: 'Internal Transfer' },
    ];

    // Map approval rules by request type
    const requestTypePermissions = requestTypes.map(reqType => {
      const rules = approvalRules.filter((rule: any) => rule.request_type === reqType.type);
      const approvers = rules.map((rule: any) => ({
        role: rule.role_name,
        roleAr: rule.role_name_ar,
        order: rule.approval_order,
        required: Boolean(rule.is_required),
      }));

      // Add ADMIN and Commissioner if not already present (they can approve all)
      const hasAdmin = approvers.some((a: any) => a.role === 'ADMIN');
      if (!hasAdmin) {
        approvers.unshift({
          role: 'ADMIN',
          roleAr: 'مدير النظام',
          order: 0,
          required: false,
        });
      }

      // Commissioners can approve most requests (except role management)
      const hasCommissioner = approvers.some((a: any) => a.role === 'COMMISSIONER');
      if (!hasCommissioner && reqType.type !== 'delegation') {
        approvers.push({
          role: 'COMMISSIONER',
          roleAr: 'مفوض',
          order: 999,
          required: false,
        });
      }

      return {
        ...reqType,
        approvers: approvers.sort((a: any, b: any) => a.order - b.order),
      };
    });

    // Format users
    const formattedPrivilegedUsers = privilegedUsers.map((user: any) => ({
      id: user.id,
      name: user.name,
      nameAr: user.full_name_ar || user.name,
      email: user.email,
      roles: user.roles ? user.roles.split(',') : [],
      rolesAr: user.roles_ar ? user.roles_ar.split(',') : [],
      position: user.position,
      department: user.department_name,
      isActive: Boolean(user.is_active),
      type: 'permanent',
    }));

    const formattedCommissioners = commissioners.map((user: any) => ({
      id: user.id,
      name: user.name,
      nameAr: user.full_name_ar || user.name,
      email: user.email,
      roles: ['COMMISSIONER'],
      rolesAr: ['مفوض'],
      position: user.position,
      department: user.department_name,
      isActive: Boolean(user.is_active),
      type: 'temporary',
      delegationPeriod: {
        start: user.start_date,
        end: user.end_date,
        reason: user.reason,
      },
    }));

    return {
      privilegedUsers: [...formattedPrivilegedUsers, ...formattedCommissioners],
      requestTypes: requestTypePermissions,
      summary: {
        totalPrivilegedUsers: formattedPrivilegedUsers.length + formattedCommissioners.length,
        admins: formattedPrivilegedUsers.filter((u: any) => u.roles.includes('ADMIN')).length,
        managers: formattedPrivilegedUsers.filter((u: any) => u.roles.includes('MANAGER')).length,
        hr: formattedPrivilegedUsers.filter((u: any) => u.roles.includes('HR')).length,
        finance: formattedPrivilegedUsers.filter((u: any) => u.roles.includes('FINANCE')).length,
        it: formattedPrivilegedUsers.filter((u: any) => u.roles.includes('IT')).length,
        commissioners: formattedCommissioners.length,
      },
    };
  });
}

// ====================== Employee Management ======================

export async function adminCreateEmployee(input: any) {
  return withConnection(async (conn) => {
    await conn.beginTransaction();
    try {
      // Insert into Employees table
      const [result] = await conn.execute<any>(
        `INSERT INTO Employees (
          employee_number, first_name, last_name, full_name_ar, 
          position, job_description, department_id, hire_date, 
          phone_primary, email_work, national_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.employee_number,
          input.first_name || null,
          input.last_name || null,
          input.full_name_ar || null,
          input.position || null,
          input.job_description || null,
          input.department_id || null,
          input.hire_date || null,
          input.phone || null,
          input.email || null,
          input.national_id || null,
        ]
      );
      
      await conn.commit();
      return { 
        success: true, 
        employee_id: result.insertId,
        message: 'تم إضافة الموظف بنجاح'
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  });
}

export async function adminUpdateEmployee(employeeId: number, input: any) {
  return withConnection(async (conn) => {
    await conn.beginTransaction();
    try {
      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      
      if (input.job_description !== undefined) {
        updates.push('job_description = ?');
        values.push(input.job_description);
      }
      if (input.position !== undefined) {
        updates.push('position = ?');
        values.push(input.position);
      }
      if (input.full_name_ar !== undefined) {
        updates.push('full_name_ar = ?');
        values.push(input.full_name_ar);
      }
      
      if (updates.length === 0) {
        throw new AppError({ statusCode: 400, message: 'No fields to update', code: 'BAD_REQUEST' });
      }
      
      values.push(employeeId);
      
      await conn.execute(
        `UPDATE Employees SET ${updates.join(', ')}, updated_at = NOW() WHERE employee_id = ?`,
        values
      );
      
      await conn.commit();
      return { 
        success: true, 
        message: 'تم تحديث بيانات الموظف بنجاح'
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  });
}

export async function adminUpdateEmployeeJobDescription(employeeId: number, jobDescription: string) {
  return withConnection(async (conn) => {
    await conn.beginTransaction();
    try {
      // Update job_description in Employees table
      const [result] = await conn.execute<any>(
        `UPDATE Employees 
         SET job_description = ?, updated_at = NOW()
         WHERE employee_id = ?`,
        [jobDescription || null, employeeId]
      );
      
      if (result.affectedRows === 0) {
        throw new AppError({ statusCode: 404, message: 'Employee not found', code: 'NOT_FOUND' });
      }
      
      await conn.commit();
      return { 
        success: true,
        message: 'تم تحديث الوصف الوظيفي بنجاح'
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  });
}
