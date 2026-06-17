import { withConnection } from '../../core/database';

export async function listUsers() {
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
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.roles ? row.roles.split(',')[0]?.toLowerCase() ?? 'employee' : 'employee',
        isActive: Boolean(row.is_active),
        roles: row.roles ? row.roles.split(',') : [],
      })
    );
  });
}

export async function getUserByEmail(email: string) {
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
       WHERE u.email = ?
       GROUP BY u.id, u.name, u.email, u.is_active`,
      [email]
    );
    const user = (rows as { id: number; name: string; email: string; is_active: number; roles: string | null }[])[0];
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.roles ? user.roles.split(',')[0]?.toLowerCase() ?? 'employee' : 'employee',
      isActive: Boolean(user.is_active),
      roles: user.roles ? user.roles.split(',') : [],
    };
  });
}

export async function getUserProfile(userId: number) {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT
         -- App_Users fields
         u.id,
         u.name,
         u.email,
         u.username,
         u.role,
         u.is_active,
         u.employee_id,
         u.created_at,
         u.updated_at AS app_users_updated_at,
         u.last_login,
         u.login_count,
         -- Excel columns from App_Users (A-I)
         u.national_id AS app_users_national_id,
         u.employee_number AS app_users_employee_number,
         u.nationality AS app_users_nationality,
         u.department_name AS app_users_department_name,
         u.job_title AS app_users_job_title,
         u.phone AS app_users_phone,
         u.employment_type AS app_users_employment_type,
         -- Employee personal info
         e.employee_id AS employee_employee_id,
         e.employee_number,
         e.full_name_ar,
         e.full_name_en,
         e.first_name,
         e.middle_name,
         e.last_name,
         e.first_name_ar,
         e.second_name_ar,
         e.third_name_ar,
         e.family_name_ar,
         -- Employee identification (basic fields only)
         e.national_id,
         e.identity_type,
         e.nationality,
         e.gender,
         e.birth_date,
         e.age,
         -- Employee contact
         e.phone_primary,
         e.phone_secondary,
         e.email_work,
         -- Employee job info
         e.department_id,
         e.department_category,
         e.position,
         e.staff_positioning,
         e.job_title,
         e.job_title_id,
         e.hire_date,
         e.contract_type,
         e.employment_status,
         e.contract_start_date,
         e.job_category_detail,
         e.worker_type,
         e.worker_classification,
         e.manager_name,
         e.manager_organization,
         e.manager_national_id,
         e.manager_email,
         e.manager_phone,
         e.created_at AS employee_created_at,
         e.updated_at AS employee_updated_at,
         -- Department info
         d.name_ar AS department_name,
         d.name_en AS department_name_en,
         d.department_code,
         -- Job title info
         jt.title_ar AS job_title_name_ar,
         jt.title_en AS job_title_name_en,
         jt.category AS job_category
       FROM App_Users u
       LEFT JOIN Employees e ON e.employee_id = u.employee_id
       LEFT JOIN Departments d ON d.department_id = e.department_id
       LEFT JOIN Job_Titles jt ON jt.job_title_id = e.job_title_id
       WHERE u.id = ?`,
      [userId]
    );
    const [user] = rows as {
      id: number;
      name: string;
      email: string;
      username?: string | null;
      role: string | null;
      is_active: number;
      employee_id: number | null;
      created_at: Date | string | null;
      last_login: Date | string | null;
      login_count: number | null;
      // Excel columns from App_Users (A-I)
      app_users_national_id?: string | null;
      app_users_employee_number?: string | null;
      app_users_nationality?: string | null;
      app_users_department_name?: string | null;
      app_users_job_title?: string | null;
      app_users_phone?: string | null;
      app_users_employment_type?: string | null;
      // Employee personal info
      employee_employee_id?: number | null;
      employee_number?: string | null;
      full_name_ar?: string | null;
      full_name_en?: string | null;
      first_name?: string | null;
      middle_name?: string | null;
      last_name?: string | null;
      first_name_ar?: string | null;
      second_name_ar?: string | null;
      third_name_ar?: string | null;
      family_name_ar?: string | null;
      // Employee identification
      national_id?: string | null;
      identity_type?: string | null;
      nationality?: string | null;
      gender?: string | null;
      birth_date?: Date | string | null;
      age?: number | null;
      // Employee contact
      phone_primary?: string | null;
      phone_secondary?: string | null;
      email_work?: string | null;
      // Employee job info
      department_id?: number | null;
      department_category?: string | null;
      position?: string | null;
      staff_positioning?: string | null;
      job_title?: string | null;
      job_title_id?: number | null;
      hire_date?: Date | string | null;
      contract_type?: string | null;
      employment_status?: string | null;
      contract_start_date?: Date | string | null;
      job_category_detail?: string | null;
      worker_type?: string | null;
      worker_classification?: string | null;
      manager_name?: string | null;
      manager_organization?: string | null;
      manager_national_id?: string | null;
      manager_email?: string | null;
      manager_phone?: string | null;
      employee_created_at?: Date | string | null;
      employee_updated_at?: Date | string | null;
      // App_Users updated_at
      app_users_updated_at?: Date | string | null;
      // Department info
      department_name?: string | null;
      department_name_en?: string | null;
      department_code?: string | null;
      // Job title info
      job_title_name_ar?: string | null;
      job_title_name_en?: string | null;
      job_category?: string | null;
    }[];
    if (!user) {
      return null;
    }
    const [rolesResult] = await conn.execute(
      `SELECT r.role_name AS role
       FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.role_id
       WHERE ur.user_id = ? AND ur.is_active = TRUE AND r.is_active = TRUE`,
      [userId]
    );
    const roles = (rolesResult as { role: string }[]).map((r) => r.role);
    return {
      // App_Users fields
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username ?? null,
      role: user.role ?? null,
      isActive: Boolean(user.is_active),
      employeeId: user.employee_id ?? null,
      createdAt: user.created_at ? new Date(user.created_at) : null,
      updatedAt: user.app_users_updated_at ? new Date(user.app_users_updated_at) : null,
      lastLogin: user.last_login ? new Date(user.last_login) : null,
      loginCount: user.login_count ?? 0,
      roles,
      // Excel columns from App_Users (A-I)
      app_users_national_id: user.app_users_national_id ?? null,
      app_users_employee_number: user.app_users_employee_number ?? null,
      app_users_nationality: user.app_users_nationality ?? null,
      app_users_department_name: user.app_users_department_name ?? null,
      app_users_job_title: user.app_users_job_title ?? null,
      app_users_phone: user.app_users_phone ?? null,
      app_users_employment_type: user.app_users_employment_type ?? null,
      // Employee personal info
      employee_employee_id: user.employee_employee_id ?? null,
      employee_number: user.employee_number ?? null,
      full_name_ar: user.full_name_ar ?? null,
      full_name_en: user.full_name_en ?? null,
      first_name: user.first_name ?? null,
      middle_name: user.middle_name ?? null,
      last_name: user.last_name ?? null,
      first_name_ar: user.first_name_ar ?? null,
      second_name_ar: user.second_name_ar ?? null,
      third_name_ar: user.third_name_ar ?? null,
      family_name_ar: user.family_name_ar ?? null,
      // Employee identification
      national_id: user.national_id ?? null,
      identity_type: user.identity_type ?? null,
      birth_date: user.birth_date ? new Date(user.birth_date) : null,
      age: user.age ?? null,
      // Employee contact
      phone_primary: user.phone_primary ?? null,
      phone_secondary: user.phone_secondary ?? null,
      email_work: user.email_work ?? null,
      // Employee job info
      department_id: user.department_id ?? null,
      department_category: user.department_category ?? null,
      job_title: user.job_title ?? null,
      job_title_id: user.job_title_id ?? null,
      hire_date: user.hire_date ? new Date(user.hire_date) : null,
      contract_type: user.contract_type ?? null,
      employment_status: user.employment_status ?? null,
      contract_start_date: user.contract_start_date ? new Date(user.contract_start_date) : null,
      job_category_detail: user.job_category_detail ?? null,
      worker_type: user.worker_type ?? null,
      worker_classification: user.worker_classification ?? null,
      manager_name: user.manager_name ?? null,
      manager_organization: user.manager_organization ?? null,
      manager_national_id: user.manager_national_id ?? null,
      manager_email: user.manager_email ?? null,
      manager_phone: user.manager_phone ?? null,
      employee_created_at: user.employee_created_at ? new Date(user.employee_created_at) : null,
      employee_updated_at: user.employee_updated_at ? new Date(user.employee_updated_at) : null,
      staff_positioning: user.staff_positioning ?? null,
      position: user.position ?? null,
      // Department info
      department_name: user.department_name ?? null,
      department_name_en: user.department_name_en ?? null,
      department_code: user.department_code ?? null,
      // Job title info
      job_title_name_ar: user.job_title_name_ar ?? null,
      job_title_name_en: user.job_title_name_en ?? null,
      job_category: user.job_category ?? null,
      // Backward compatibility (camelCase)
      employeeNumber: user.employee_number ?? null,
      fullNameAr: user.full_name_ar ?? null,
      fullNameEn: user.full_name_en ?? null,
      firstName: user.first_name ?? null,
      middleName: user.middle_name ?? null,
      lastName: user.last_name ?? null,
      nationalId: user.national_id ?? null,
      identityType: user.identity_type ?? null,
      birthDate: user.birth_date ? new Date(user.birth_date) : null,
      nationality: user.nationality ?? null,
      gender: user.gender ?? null,
      phone: user.phone_primary ?? null,
      phoneSecondary: user.phone_secondary ?? null,
      emailWork: user.email_work ?? null,
      departmentId: user.department_id ?? null,
      departmentCategory: user.department_category ?? null,
      jobTitle: user.job_title ?? null,
      staffPositioning: user.staff_positioning ?? null,
      jobTitleId: user.job_title_id ?? null,
      hireDate: user.hire_date ? new Date(user.hire_date) : null,
      contractType: user.contract_type ?? null,
      employmentStatus: user.employment_status ?? null,
      contractStartDate: user.contract_start_date ? new Date(user.contract_start_date) : null,
      jobCategoryDetail: user.job_category_detail ?? null,
      workerType: user.worker_type ?? null,
      workerClassification: user.worker_classification ?? null,
      managerName: user.manager_name ?? null,
      managerOrganization: user.manager_organization ?? null,
      managerNationalId: user.manager_national_id ?? null,
      managerEmail: user.manager_email ?? null,
      managerPhone: user.manager_phone ?? null,
      departmentName: user.department_name ?? null,
      departmentNameEn: user.department_name_en ?? null,
      departmentCode: user.department_code ?? null,
      jobTitleNameAr: user.job_title_name_ar ?? null,
      jobTitleNameEn: user.job_title_name_en ?? null,
      jobCategory: user.job_category ?? null,
      employee_id: user.employee_id ?? null,
      created_at: user.created_at ? new Date(user.created_at) : null,
      updated_at: user.app_users_updated_at ? new Date(user.app_users_updated_at) : null,
    };
  });
}

/**
 * Get list of unique departments from App_Users table
 * This endpoint is accessible to all authenticated employees (not just admins)
 * Returns distinct department names from the department_name column
 */
export async function getDepartmentsList(): Promise<{ id: number; name_ar: string; name_en?: string }[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT DISTINCT
        department_name AS name_ar
      FROM App_Users
      WHERE department_name IS NOT NULL
        AND TRIM(department_name) != ''
        AND department_name NOT IN ('NULL', 'null', 'Null')
        AND is_active = 1
      ORDER BY department_name ASC`
    );
    
    // Convert to array with index-based IDs
    return (rows as { name_ar: string }[]).map((row, index) => ({
      id: index + 1, // Use index-based ID since we don't have department_id in App_Users
      name_ar: (row.name_ar || '').trim(),
      name_en: undefined // Can be populated later if needed
    }));
  });
}

/**
 * Get list of unique job titles from App_Users table
 * Returns distinct job titles from the job_title column
 */
export async function getJobTitlesList(): Promise<{ id: number; title_ar: string; title_en?: string }[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT DISTINCT
        job_title AS title_ar
      FROM App_Users
      WHERE job_title IS NOT NULL
        AND TRIM(job_title) != ''
        AND job_title NOT IN ('NULL', 'null', 'Null')
        AND is_active = 1
      ORDER BY job_title ASC`
    );
    
    return (rows as { title_ar: string }[]).map((row, index) => ({
      id: index + 1,
      title_ar: (row.title_ar || '').trim(),
      title_en: undefined // Can be populated later if needed
    }));
  });
}
