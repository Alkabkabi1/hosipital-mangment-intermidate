import type { RowDataPacket } from 'mysql2/promise';

import { withConnection } from '../../core/database';
import { AppError } from '../../core/errors';

interface NotificationRow extends RowDataPacket {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: Date;
}

/**
 * Send a role change notification to a user
 * @param userId - The ID of the user who's role changed
 * @param action - The action performed ('ASSIGNED' or 'REMOVED')
 * @param roleName - The name of the role
 * @param performedBy - The ID of the user who performed the action
 */
export async function sendRoleChangeNotification(
  userId: number,
  action: 'ASSIGNED' | 'REMOVED',
  roleName: string,
  performedBy: number
): Promise<void> {
  const actionAr = action === 'ASSIGNED' ? 'تم تعيين' : 'تم إزالة';
  const title = action === 'ASSIGNED' ? 'تم تعيين صلاحية جديدة' : 'تم إزالة صلاحية';
  
  // Get the performer's name
  const performerName = await withConnection(async (conn) => {
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT name FROM App_Users WHERE id = ? LIMIT 1',
      [performedBy]
    );
    const [user] = rows as { name: string }[];
    return user?.name || 'مدير النظام';
  });

  const message = `${actionAr} صلاحية "${roleName}" بواسطة ${performerName}`;

  // Store notification in database
  await withConnection(async (conn) => {
    // Check if notifications table exists
    const [tables] = await conn.execute<RowDataPacket[]>(
      "SHOW TABLES LIKE 'notifications'"
    );

    if (tables.length === 0) {
      // Create notifications table if it doesn't exist
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          notification_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'INFO',
          is_read TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_notifications (user_id, is_read),
          FOREIGN KEY (user_id) REFERENCES App_Users(id) ON DELETE CASCADE
        )
      `);
    }

    // Insert notification
    await conn.execute(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES (?, ?, ?, ?, 0)`,
      [userId, title, message, 'ROLE_CHANGE']
    );
  });

  console.log(`✅ Role change notification sent: User ${userId}, Action: ${action}, Role: ${roleName}`);
}

/**
 * Get unread notifications for a user
 * @param userId - The ID of the user
 * @returns Array of unread notifications
 */
export async function getUnreadNotifications(userId: number): Promise<NotificationRow[]> {
  return withConnection(async (conn) => {
    // Check if notifications table exists
    const [tables] = await conn.execute<RowDataPacket[]>(
      "SHOW TABLES LIKE 'notifications'"
    );

    if (tables.length === 0) {
      return [];
    }

    const [rows] = await conn.execute<NotificationRow[]>(
      `SELECT notification_id, user_id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ? AND is_read = 0
       ORDER BY created_at DESC`,
      [userId]
    );

    return rows;
  });
}

/**
 * Get all notifications for a user (paginated)
 * @param userId - The ID of the user
 * @param limit - Maximum number of notifications to return
 * @param offset - Number of notifications to skip
 * @returns Array of notifications
 */
export async function getUserNotifications(
  userId: number,
  limit = 20,
  offset = 0
): Promise<NotificationRow[]> {
  return withConnection(async (conn) => {
    // Check if notifications table exists
    const [tables] = await conn.execute<RowDataPacket[]>(
      "SHOW TABLES LIKE 'notifications'"
    );

    if (tables.length === 0) {
      return [];
    }

    const [rows] = await conn.execute<NotificationRow[]>(
      `SELECT notification_id, user_id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return rows;
  });
}

/**
 * Mark notifications as read
 * @param notificationIds - Array of notification IDs to mark as read
 * @param userId - The ID of the user (for security)
 */
export async function markNotificationsAsRead(notificationIds: number[], userId: number): Promise<void> {
  if (!notificationIds.length) return;

  await withConnection(async (conn) => {
    const placeholders = notificationIds.map(() => '?').join(',');
    await conn.execute(
      `UPDATE notifications 
       SET is_read = 1 
       WHERE notification_id IN (${placeholders}) AND user_id = ?`,
      [...notificationIds, userId]
    );
  });
}

/**
 * Mark all notifications as read for a user
 * @param userId - The ID of the user
 */
export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  await withConnection(async (conn) => {
    await conn.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );
  });
}

/**
 * Delete old notifications (cleanup job)
 * @param daysOld - Delete notifications older than this many days
 */
export async function deleteOldNotifications(daysOld = 90): Promise<number> {
  return withConnection(async (conn) => {
    const [result] = await conn.execute(
      `DELETE FROM notifications 
       WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND is_read = 1`,
      [daysOld]
    );

    const resultHeader = result as unknown as { affectedRows: number };
    return resultHeader.affectedRows || 0;
  });
}

