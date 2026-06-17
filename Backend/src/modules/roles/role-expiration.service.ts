import type { RowDataPacket } from 'mysql2/promise';

import { withConnection } from '../../core/database';
import { sendRoleChangeNotification } from '../notifications/role-notification.service';

interface ExpiringRoleRow extends RowDataPacket {
  user_role_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  role_id: number;
  role_name: string;
  role_name_ar: string | null;
  expires_at: Date;
  days_until_expiration: number;
  expiration_notified: number;
  assigned_by: number | null;
  assigned_at: Date;
}

/**
 * Get roles expiring within specified days
 */
export async function getExpiringRoles(days = 7): Promise<ExpiringRoleRow[]> {
  return withConnection(async (conn) => {
    // Check if view exists
    const [tables] = await conn.execute<RowDataPacket[]>(
      "SHOW FULL TABLES WHERE Table_type = 'VIEW' AND Tables_in_" + process.env.DB_NAME + " = 'expiring_roles'"
    );

    if (tables.length === 0) {
      console.warn('⚠️ expiring_roles view does not exist');
      return [];
    }

    const [rows] = await conn.execute<ExpiringRoleRow[]>(
      'SELECT * FROM expiring_roles WHERE days_until_expiration <= ? ORDER BY expires_at ASC',
      [days]
    );

    return rows;
  });
}

/**
 * Get already expired roles (still active but past expiration date)
 */
export async function getExpiredRoles(): Promise<RowDataPacket[]> {
  return withConnection(async (conn) => {
    // Check if view exists
    const [tables] = await conn.execute<RowDataPacket[]>(
      "SHOW FULL TABLES WHERE Table_type = 'VIEW' AND Tables_in_" + process.env.DB_NAME + " = 'expired_roles'"
    );

    if (tables.length === 0) {
      console.warn('⚠️ expired_roles view does not exist');
      return [];
    }

    const [rows] = await conn.execute<RowDataPacket[]>('SELECT * FROM expired_roles ORDER BY expires_at ASC');

    return rows;
  });
}

/**
 * Disable expired roles
 * Returns number of roles disabled
 */
export async function disableExpiredRoles(): Promise<number> {
  return withConnection(async (conn) => {
    const [result] = await conn.execute(
      `UPDATE user_roles 
       SET is_active = FALSE
       WHERE is_active = TRUE 
         AND expires_at IS NOT NULL 
         AND expires_at < NOW()`,
      []
    );

    const resultHeader = result as unknown as { affectedRows: number };
    return resultHeader.affectedRows || 0;
  });
}

/**
 * Send expiration notifications for roles expiring soon
 * @param daysThreshold - Notify for roles expiring within this many days (default: 7)
 * @returns Number of notifications sent
 */
export async function sendExpirationNotifications(daysThreshold = 7): Promise<number> {
  const expiringRoles = await getExpiringRoles(daysThreshold);

  // Filter for roles that haven't been notified yet
  const toNotify = expiringRoles.filter(role => role.expiration_notified === 0);

  if (toNotify.length === 0) {
    return 0;
  }

  let notificationsSent = 0;

  for (const role of toNotify) {
    try {
      // Send notification
      const expiryDate = new Date(role.expires_at).toLocaleDateString('ar-SA');
      const message = `صلاحية "${role.role_name}" ستنتهي في ${expiryDate} (${role.days_until_expiration} أيام)`;

      await withConnection(async (conn) => {
        // Check if notifications table exists
        const [tables] = await conn.execute<RowDataPacket[]>(
          "SHOW TABLES LIKE 'notifications'"
        );

        if (tables.length > 0) {
          await conn.execute(
            `INSERT INTO notifications (user_id, title, message, type, is_read)
             VALUES (?, ?, ?, ?, 0)`,
            [role.user_id, 'تنبيه: صلاحية قاربت على الانتهاء', message, 'ROLE_EXPIRING']
          );

          // Mark as notified
          await conn.execute(
            'UPDATE user_roles SET expiration_notified = 1 WHERE user_role_id = ?',
            [role.user_role_id]
          );

          notificationsSent++;
        }
      });
    } catch (error) {
      console.error(`Failed to send expiration notification for role ${role.user_role_id}:`, error);
    }
  }

  return notificationsSent;
}

/**
 * Renew (extend) a role's expiration
 * @param userRoleId - The user_role_id to renew
 * @param additionalDays - Number of days to extend (default: 30)
 */
export async function renewRole(userRoleId: number, additionalDays = 30): Promise<void> {
  await withConnection(async (conn) => {
    // Extend expiration and reset notification flag
    const [result] = await conn.execute(
      `UPDATE user_roles 
       SET expires_at = DATE_ADD(COALESCE(expires_at, NOW()), INTERVAL ? DAY),
           expiration_notified = 0
       WHERE user_role_id = ? AND is_active = TRUE`,
      [additionalDays, userRoleId]
    );

    const resultHeader = result as unknown as { affectedRows: number };
    if (!resultHeader.affectedRows) {
      throw new Error('Role assignment not found or already inactive');
    }
  });
}

/**
 * Run the complete expiration check job
 * This should be called periodically (e.g., daily via cron)
 * @returns Summary of actions taken
 */
export async function runExpirationJob(): Promise<{
  expired: number;
  notified: number;
}> {
  console.log('🔄 Running role expiration job...');

  // 1. Disable expired roles
  const expired = await disableExpiredRoles();
  if (expired > 0) {
    console.log(`✅ Disabled ${expired} expired role(s)`);
  }

  // 2. Send notifications for expiring roles (7 days threshold)
  const notified = await sendExpirationNotifications(7);
  if (notified > 0) {
    console.log(`✅ Sent ${notified} expiration notification(s)`);
  }

  // 3. Also check for imminent expirations (1 day)
  const notified1Day = await sendExpirationNotifications(1);
  if (notified1Day > 0) {
    console.log(`✅ Sent ${notified1Day} urgent expiration notification(s)`);
  }

  console.log('✅ Role expiration job complete');

  return {
    expired,
    notified: notified + notified1Day,
  };
}

