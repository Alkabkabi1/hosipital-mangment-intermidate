import { withConnection } from '../../core/database';
import type { RowDataPacket } from 'mysql2';

export interface LoginActivity {
  userId: number;
  userName: string;
  userEmail: string;
  lastLogin: string | null;
  loginCount: number;
  isActive: boolean;
  roles: string[];
}

export interface LoginSession {
  auditId: number;
  userId: number;
  userName: string;
  userEmail: string;
  loginTime: string;
  ipAddress: string | null;
  action: string;
}

/**
 * Get all users with their login activity summary
 */
export async function getUserLoginActivity(): Promise<LoginActivity[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        u.id as userId,
        u.name as userName,
        u.email as userEmail,
        u.last_login as lastLogin,
        u.login_count as loginCount,
        u.is_active as isActive,
        GROUP_CONCAT(r.role_name) as roles
      FROM App_Users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
      LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
      GROUP BY u.id, u.name, u.email, u.last_login, u.login_count, u.is_active
      ORDER BY COALESCE(u.last_login, '1970-01-01') DESC, u.name ASC`
    );

    return rows.map((row) => ({
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      lastLogin: row.lastLogin ? new Date(row.lastLogin).toISOString() : null,
      loginCount: row.loginCount || 0,
      isActive: Boolean(row.isActive),
      roles: row.roles ? row.roles.split(',') : [],
    }));
  });
}

/**
 * Get recent login sessions from audit log
 */
export async function getRecentLoginSessions(limit = 100): Promise<LoginSession[]> {
  return withConnection(async (conn) => {
    // Ensure limit is a valid integer
    const safeLimit = Math.max(1, Math.min(1000, parseInt(String(limit), 10) || 100));
    
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        ae.id as auditId,
        ae.user_id as userId,
        u.name as userName,
        u.email as userEmail,
        ae.ts as loginTime,
        ae.ip as ipAddress,
        ae.action
      FROM Audit_Events ae
      INNER JOIN App_Users u ON ae.user_id = u.id
      WHERE ae.action = 'USER_LOGIN'
      ORDER BY ae.ts DESC
      LIMIT ${safeLimit}`
    );

    return rows.map((row) => ({
      auditId: row.auditId,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      loginTime: new Date(row.loginTime).toISOString(),
      ipAddress: row.ipAddress || null,
      action: row.action,
    }));
  });
}

/**
 * Get login activity for a specific user
 */
export async function getUserLoginHistory(userId: number, limit = 50): Promise<LoginSession[]> {
  return withConnection(async (conn) => {
    // Ensure limit is a valid integer
    const safeLimit = Math.max(1, Math.min(1000, parseInt(String(limit), 10) || 50));
    
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        ae.id as auditId,
        ae.user_id as userId,
        u.name as userName,
        u.email as userEmail,
        ae.ts as loginTime,
        ae.ip as ipAddress,
        ae.action
      FROM Audit_Events ae
      INNER JOIN App_Users u ON ae.user_id = u.id
      WHERE ae.action = 'USER_LOGIN' AND ae.user_id = ?
      ORDER BY ae.ts DESC
      LIMIT ${safeLimit}`,
      [userId]
    );

    return rows.map((row) => ({
      auditId: row.auditId,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      loginTime: new Date(row.loginTime).toISOString(),
      ipAddress: row.ipAddress || null,
      action: row.action,
    }));
  });
}

/**
 * Get currently active users (logged in within last 24 hours)
 */
export async function getActiveUsers(): Promise<LoginActivity[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        u.id as userId,
        u.name as userName,
        u.email as userEmail,
        u.last_login as lastLogin,
        u.login_count as loginCount,
        u.is_active as isActive,
        GROUP_CONCAT(r.role_name) as roles
      FROM App_Users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
      LEFT JOIN roles r ON ur.role_id = r.role_id AND r.is_active = TRUE
      WHERE u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND u.is_active = TRUE
      GROUP BY u.id, u.name, u.email, u.last_login, u.login_count, u.is_active
      ORDER BY u.last_login DESC`
    );

    return rows.map((row) => ({
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      lastLogin: row.lastLogin ? new Date(row.lastLogin).toISOString() : null,
      loginCount: row.loginCount || 0,
      isActive: Boolean(row.isActive),
      roles: row.roles ? row.roles.split(',') : [],
    }));
  });
}

/**
 * Get login statistics
 */
export async function getLoginStatistics() {
  return withConnection(async (conn) => {
    const [stats] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(DISTINCT u.id) as totalUsers,
        COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN u.id END) as activeToday,
        COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN u.id END) as activeThisWeek,
        COUNT(DISTINCT CASE WHEN u.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id END) as activeThisMonth,
        COUNT(DISTINCT CASE WHEN u.last_login IS NULL THEN u.id END) as neverLoggedIn,
        SUM(u.login_count) as totalLogins
      FROM App_Users u
      WHERE u.is_active = TRUE`
    );

    const [recentLogins] = await conn.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count, DATE(ts) as loginDate
       FROM Audit_Events
       WHERE action = 'USER_LOGIN'
         AND ts >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(ts)
       ORDER BY loginDate DESC`
    );

    return {
      summary: stats[0] || {},
      dailyLogins: recentLogins,
    };
  });
}

