import type { RowDataPacket } from 'mysql2/promise';

import { withConnection } from '../../core/database';

interface AccessAuditEntry {
  user_id: number;
  endpoint: string;
  http_method: string;
  required_roles?: string[];
  user_roles?: string[];
  access_granted: boolean;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
}

interface AuditSummaryRow extends RowDataPacket {
  user_id: number;
  user_name: string;
  user_email: string;
  endpoint: string;
  http_method: string;
  total_attempts: number;
  granted_count: number;
  denied_count: number;
  last_attempt: Date;
  attempt_date: string;
}

interface DeniedAccessRow extends RowDataPacket {
  user_id: number;
  user_name: string;
  user_email: string;
  endpoint: string;
  http_method: string;
  required_roles: string;
  user_roles: string;
  ip_address: string;
  denial_count: number;
  last_denial: Date;
  denial_date: string;
}

/**
 * Log an access attempt (granted or denied)
 * Non-blocking - failures are logged but don't throw
 */
export async function logAccessAttempt(entry: AccessAuditEntry): Promise<void> {
  try {
    await withConnection(async (conn) => {
      // Check if table exists first
      const [tables] = await conn.execute<RowDataPacket[]>(
        "SHOW TABLES LIKE 'role_access_audit'"
      );

      if (tables.length === 0) {
        console.warn('⚠️ role_access_audit table does not exist, skipping audit log');
        return;
      }

      await conn.execute(
        `INSERT INTO role_access_audit 
         (user_id, endpoint, http_method, required_roles, user_roles, access_granted, ip_address, user_agent, request_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.user_id,
          entry.endpoint,
          entry.http_method,
          entry.required_roles ? JSON.stringify(entry.required_roles) : null,
          entry.user_roles ? JSON.stringify(entry.user_roles) : null,
          entry.access_granted ? 1 : 0,
          entry.ip_address || null,
          entry.user_agent || null,
          entry.request_id || null,
        ]
      );
    });
  } catch (error) {
    // Log but don't throw - audit failures shouldn't break the application
    console.error('Failed to log access attempt:', error);
  }
}

/**
 * Get access audit summary for a date range
 */
export async function getAccessAuditSummary(
  startDate?: Date,
  endDate?: Date,
  userId?: number
): Promise<AuditSummaryRow[]> {
  return withConnection(async (conn) => {
    let query = `
      SELECT 
        user_id, user_name, user_email, endpoint, http_method,
        total_attempts, granted_count, denied_count, last_attempt, attempt_date
      FROM access_audit_summary
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (startDate) {
      query += ' AND attempt_date >= ?';
      params.push(startDate.toISOString().split('T')[0]);
    }

    if (endDate) {
      query += ' AND attempt_date <= ?';
      params.push(endDate.toISOString().split('T')[0]);
    }

    query += ' ORDER BY last_attempt DESC LIMIT 1000';

    const [rows] = await conn.execute<AuditSummaryRow[]>(query, params);
    return rows;
  });
}

/**
 * Get denied access attempts for security monitoring
 */
export async function getDeniedAccessAttempts(
  startDate?: Date,
  endDate?: Date,
  userId?: number
): Promise<DeniedAccessRow[]> {
  return withConnection(async (conn) => {
    let query = `
      SELECT 
        user_id, user_name, user_email, endpoint, http_method,
        required_roles, user_roles, ip_address,
        denial_count, last_denial, denial_date
      FROM denied_access_summary
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (startDate) {
      query += ' AND denial_date >= ?';
      params.push(startDate.toISOString().split('T')[0]);
    }

    if (endDate) {
      query += ' AND denial_date <= ?';
      params.push(endDate.toISOString().split('T')[0]);
    }

    query += ' ORDER BY denial_count DESC, last_denial DESC LIMIT 1000';

    const [rows] = await conn.execute<DeniedAccessRow[]>(query, params);
    return rows;
  });
}

/**
 * Get users with excessive access denials (potential security concern)
 */
export async function getUsersWithExcessiveDenials(
  threshold = 10,
  days = 7
): Promise<{ user_id: number; user_email: string; total_denials: number }[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        user_id, 
        user_email,
        SUM(denial_count) as total_denials
       FROM denied_access_summary
       WHERE denial_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY user_id, user_email
       HAVING total_denials > ?
       ORDER BY total_denials DESC`,
      [days, threshold]
    );

    return rows as { user_id: number; user_email: string; total_denials: number }[];
  });
}

/**
 * Get most accessed endpoints by role
 */
export async function getMostAccessedEndpoints(
  limit = 20
): Promise<{ endpoint: string; http_method: string; access_count: number }[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        endpoint,
        http_method,
        SUM(total_attempts) as access_count
       FROM access_audit_summary
       WHERE attempt_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY endpoint, http_method
       ORDER BY access_count DESC
       LIMIT ?`,
      [limit]
    );

    return rows as { endpoint: string; http_method: string; access_count: number }[];
  });
}

/**
 * Get detailed audit records for a specific user
 */
export async function getUserAuditHistory(
  userId: number,
  limit = 100,
  offset = 0
): Promise<RowDataPacket[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        audit_id, endpoint, http_method, required_roles, user_roles,
        access_granted, ip_address, created_at
       FROM role_access_audit
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return rows;
  });
}

/**
 * Cleanup old audit logs (for maintenance jobs)
 */
export async function cleanupOldAuditLogs(daysToKeep = 90): Promise<number> {
  return withConnection(async (conn) => {
    const [result] = await conn.execute(
      `DELETE FROM role_access_audit 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [daysToKeep]
    );

    const resultHeader = result as unknown as { affectedRows: number };
    return resultHeader.affectedRows || 0;
  });
}

