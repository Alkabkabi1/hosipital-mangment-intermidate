import { dbPool } from '../../core/database';

const ELEVATED = ['HR','IT','FINANCE','MANAGER'];

export async function detectStaleAdmins(days: number) {
  const [rows]: any = await dbPool.query(
    `SELECT u.id AS userId, u.email, u.last_login
     FROM App_Users u
     INNER JOIN user_roles ur ON ur.user_id=u.id AND ur.is_active=TRUE
     INNER JOIN roles r ON r.role_id=ur.role_id AND r.is_active=TRUE AND UPPER(r.role_name)='ADMIN'
     WHERE (u.last_login IS NULL OR u.last_login < (NOW() - INTERVAL ? DAY))`,
    [days]
  );
  return (rows||[]).map((r:any)=>({ type: 'stale_admin', userId: r.userId, email: r.email, details: { last_login: r.last_login } }));
}

export async function detectOrphanedElevated() {
  const [rows]: any = await dbPool.query(
    `SELECT u.id AS userId, u.email, GROUP_CONCAT(DISTINCT r.role_name) AS roles, e.department_id
     FROM App_Users u
     INNER JOIN user_roles ur ON ur.user_id=u.id AND ur.is_active=TRUE
     INNER JOIN roles r ON r.role_id=ur.role_id AND r.is_active=TRUE
     LEFT JOIN Employees e ON e.employee_id = u.employee_id
     WHERE UPPER(r.role_name) IN (${ELEVATED.map(()=>'?').join(',')})
     GROUP BY u.id, u.email, e.department_id`,
    ELEVATED
  );
  return (rows||[])
    .filter((r:any)=> !r.department_id)
    .map((r:any)=>({ type: 'orphaned_elevated', userId: r.userId, email: r.email, details: { roles: r.roles } }));
}

export async function detectDuplicateRoleRows() {
  const [rows]: any = await dbPool.query(
    `SELECT ur.user_id AS userId, ur.role_id, COUNT(*) AS cnt, u.email
     FROM user_roles ur
     INNER JOIN App_Users u ON u.id=ur.user_id
     WHERE ur.is_active=TRUE
     GROUP BY ur.user_id, ur.role_id
     HAVING COUNT(*)>1`
  );
  return (rows||[]).map((r:any)=>({ type: 'duplicate_role', userId: r.userId, email: r.email, details: { role_id: r.role_id, count: r.cnt } }));
}

export async function getDriftReport(env: { STALE_DAYS_ADMIN?: number } = {}) {
  const days = Number(env.STALE_DAYS_ADMIN || process.env.STALE_DAYS_ADMIN || 90);
  const [staleAdmins, orphanedElevated, duplicates] = await Promise.all([
    detectStaleAdmins(days),
    detectOrphanedElevated(),
    detectDuplicateRoleRows(),
  ]);
  return { staleAdmins, orphanedElevated, duplicates };
}

