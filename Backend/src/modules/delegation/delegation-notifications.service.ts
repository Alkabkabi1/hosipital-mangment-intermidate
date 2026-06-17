/**
 * Delegation Notifications Service
 * Handles sending notifications when delegations are issued or updated
 */

import { withConnection } from '../../core/database';
import { logger } from '../../core/logger';

export interface DelegationNotification {
  recipientUserId: number;
  recipientEmployeeId: number;
  delegationId: number;
  referenceNumber: string;
  notificationType: 'delegation_issued' | 'delegation_updated' | 'delegation_revoked';
  message: string;
  messageAr: string;
}

/**
 * Store notification in database
 */
async function storeNotification(notification: DelegationNotification): Promise<void> {
  return withConnection(async (conn) => {
    await conn.execute(
      `INSERT INTO Notifications (
        user_id, title, title_ar, message, message_ar, 
        type, reference_id, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
      [
        notification.recipientUserId,
        `Delegation ${notification.notificationType.split('_')[1]}`,
        notification.messageAr,
        notification.message,
        notification.messageAr,
        notification.notificationType,
        notification.delegationId
      ]
    );
  });
}

/**
 * Send notification when a delegation is issued to an employee
 */
export async function notifyDelegationIssued(
  delegationId: number,
  delegatorName: string,
  delegatedToEmployeeId: number | null,
  delegationType: string,
  referenceNumber: string
): Promise<void> {
  try {
    if (!delegatedToEmployeeId) {
      logger.info({ delegationId }, 'No delegated employee specified, skipping notification');
      return;
    }

    // Get the user ID for the delegated employee
    const userId = await withConnection(async (conn) => {
      const [rows] = await conn.execute<any[]>(
        'SELECT id FROM App_Users WHERE employee_id = ?',
        [delegatedToEmployeeId]
      );
      return rows.length > 0 ? rows[0].id : null;
    });

    if (!userId) {
      logger.warn({ delegatedToEmployeeId }, 'No user found for delegated employee');
      return;
    }

    const message = `You have been granted a new delegation (${delegationType}) by ${delegatorName}. Reference: ${referenceNumber}`;
    const messageAr = `تم تفويضك بصلاحيات جديدة (${delegationType}) من ${delegatorName}. الرقم المرجعي: ${referenceNumber}`;

    await storeNotification({
      recipientUserId: userId,
      recipientEmployeeId: delegatedToEmployeeId,
      delegationId,
      referenceNumber,
      notificationType: 'delegation_issued',
      message,
      messageAr
    });

    logger.info({ delegationId, userId }, 'Delegation notification sent');
  } catch (error) {
    logger.error({ error, delegationId }, 'Failed to send delegation notification');
  }
}

/**
 * Send notification when a delegation is approved/updated
 */
export async function notifyDelegationUpdated(
  delegationId: number,
  delegatedToEmployeeId: number | null,
  newStatus: string,
  referenceNumber: string
): Promise<void> {
  try {
    if (!delegatedToEmployeeId) {
      return;
    }

    const userId = await withConnection(async (conn) => {
      const [rows] = await conn.execute<any[]>(
        'SELECT id FROM App_Users WHERE employee_id = ?',
        [delegatedToEmployeeId]
      );
      return rows.length > 0 ? rows[0].id : null;
    });

    if (!userId) {
      return;
    }

    const statusMessagesAr: Record<string, string> = {
      'approved': 'تمت الموافقة',
      'rejected': 'تم الرفض',
      'active': 'نشط',
      'completed': 'مكتمل',
      'revoked': 'تم الإلغاء'
    };

    const statusAr = statusMessagesAr[newStatus] || newStatus;
    const message = `Your delegation (${referenceNumber}) status has been updated to: ${newStatus}`;
    const messageAr = `تم تحديث حالة تفويضك (${referenceNumber}) إلى: ${statusAr}`;

    await storeNotification({
      recipientUserId: userId,
      recipientEmployeeId: delegatedToEmployeeId,
      delegationId,
      referenceNumber,
      notificationType: 'delegation_updated',
      message,
      messageAr
    });

    logger.info({ delegationId, userId, newStatus }, 'Delegation update notification sent');
  } catch (error) {
    logger.error({ error, delegationId }, 'Failed to send delegation update notification');
  }
}

/**
 * Send notification when a delegation is revoked
 */
export async function notifyDelegationRevoked(
  delegationId: number,
  delegatedToEmployeeId: number | null,
  reason: string,
  referenceNumber: string
): Promise<void> {
  try {
    if (!delegatedToEmployeeId) {
      return;
    }

    const userId = await withConnection(async (conn) => {
      const [rows] = await conn.execute<any[]>(
        'SELECT id FROM App_Users WHERE employee_id = ?',
        [delegatedToEmployeeId]
      );
      return rows.length > 0 ? rows[0].id : null;
    });

    if (!userId) {
      return;
    }

    const message = `Your delegation (${referenceNumber}) has been revoked${reason ? `: ${reason}` : ''}`;
    const messageAr = `تم إلغاء تفويضك (${referenceNumber})${reason ? `: ${reason}` : ''}`;

    await storeNotification({
      recipientUserId: userId,
      recipientEmployeeId: delegatedToEmployeeId,
      delegationId,
      referenceNumber,
      notificationType: 'delegation_revoked',
      message,
      messageAr
    });

    logger.info({ delegationId, userId }, 'Delegation revocation notification sent');
  } catch (error) {
    logger.error({ error, delegationId }, 'Failed to send delegation revocation notification');
  }
}

