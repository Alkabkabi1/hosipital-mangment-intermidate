import type { RequestHandler } from 'express';
import { dbPool } from '../../core/database';

type Row = {
  user_id: number;
  email: string;
  active: number;
  roles: string | null;
  department: string | null;
  manager_email: string | null;
  last_login_at: Date | string | null;
};

async function fetchUsersRoles(): Promise<Row[]> {
  const [rows] = await dbPool.query(
    `SELECT 
        u.id         AS user_id,
        u.email      AS email,
        u.is_active  AS active,
        GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name SEPARATOR ';') AS roles,
        d.name_en    AS department,
        NULL         AS manager_email,
        u.last_login AS last_login_at
     FROM App_Users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
     LEFT JOIN roles r ON r.role_id = ur.role_id AND r.is_active = TRUE
     LEFT JOIN Employees e ON e.employee_id = u.employee_id
     LEFT JOIN Departments d ON d.department_id = e.department_id
     GROUP BY u.id, u.email, u.is_active, d.name_en, u.last_login
     ORDER BY u.id`
  );
  return rows as Row[];
}

export const exportUsersRolesJsonController: RequestHandler = async (_req, res, next) => {
  try {
    const rows = await fetchUsersRoles();
    res.json(rows.map((r) => ({
      user_id: r.user_id,
      email: r.email,
      active: !!r.active,
      roles: (r.roles || '').split(';').filter(Boolean),
      department: r.department,
      manager_email: r.manager_email,
      last_login_at: r.last_login_at,
    })));
  } catch (err) {
    next(err);
  }
};

export const exportUsersRolesCsvController: RequestHandler = async (_req, res, next) => {
  try {
    const rows = await fetchUsersRoles();
    const header = 'user_id,email,active,roles,department,manager_email,last_login_at';
    const lines = rows.map((r) => [
      r.user_id,
      r.email,
      r.active ? '1' : '0',
      (r.roles || ''),
      (r.department || ''),
      (r.manager_email || ''),
      (r.last_login_at || ''),
    ].map((v) => String(v).replace(/"/g, '""')).map((v) => /[,\n"]/.test(v) ? `"${v}"` : v).join(','));
    const csv = [header, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users_roles.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

