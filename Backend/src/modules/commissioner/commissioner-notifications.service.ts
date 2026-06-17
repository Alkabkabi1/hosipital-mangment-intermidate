/**
 * Commissioner Notifications Service  
 * Handles sending notifications when commissioner tickets are issued
 */

import { withConnection } from '../../core/database';
import { logger } from '../../core/logger';

export interface CommissionerNotification {
  recipientUserId: number;
  ticketId: number;
  scopes: string[];
  validFrom: Date;
  validTo: Date;
  issuerName: string;
}

/**
 * Send notification when a commissioner ticket is issued
 */
export async function notifyTicketIssued(
  ticketId: number,
  subjectUserId: number,
  issuerUserId: number,
  scopes: string[],
  validFrom: Date,
  validTo: Date
): Promise<void> {
  try {
    // Get issuer name
    const issuerName = await withConnection(async (conn) => {
      const [rows] = await conn.execute<any[]>(
        'SELECT name FROM App_Users WHERE id = ?',
        [issuerUserId]
      );
      return rows.length > 0 ? rows[0].name : 'System';
    });

    const scopesText = scopes.join(', ');
    const message = `You have been granted commissioner privileges by ${issuerName}. Scopes: ${scopesText}. Valid from ${validFrom.toLocaleDateString()} to ${validTo.toLocaleDateString()}`;
    const messageAr = `تم منحك صلاحيات مفوض من ${issuerName}. الصلاحيات: ${scopesText}. صالح من ${validFrom.toLocaleDateString('ar-SA')} إلى ${validTo.toLocaleDateString('ar-SA')}`;

    await withConnection(async (conn) => {
      await conn.execute(
        `INSERT INTO Notifications (
          user_id, title, title_ar, message, message_ar,
          type, reference_id, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
        [
          subjectUserId,
          'Commissioner Privileges Granted',
          'تم منح صلاحيات مفوض',
          message,
          messageAr,
          'commissioner_issued',
          ticketId
        ]
      );
    });

    logger.info({ ticketId, subjectUserId }, 'Commissioner ticket notification sent');
  } catch (error) {
    logger.error({ error, ticketId }, 'Failed to send commissioner ticket notification');
  }
}

/**
 * Send notification when a commissioner ticket is revoked
 */
export async function notifyTicketRevoked(
  ticketId: number,
  subjectUserId: number,
  reason?: string
): Promise<void> {
  try {
    const message = `Your commissioner privileges have been revoked${reason ? `: ${reason}` : ''}`;
    const messageAr = `تم إلغاء صلاحياتك كمفوض${reason ? `: ${reason}` : ''}`;

    await withConnection(async (conn) => {
      await conn.execute(
        `INSERT INTO Notifications (
          user_id, title, title_ar, message, message_ar,
          type, reference_id, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, NOW())`,
        [
          subjectUserId,
          'Commissioner Privileges Revoked',
          'تم إلغاء صلاحيات المفوض',
          message,
          messageAr,
          'commissioner_revoked',
          ticketId
        ]
      );
    });

    logger.info({ ticketId, subjectUserId }, 'Commissioner revocation notification sent');
  } catch (error) {
    logger.error({ error, ticketId }, 'Failed to send commissioner revocation notification');
  }
}

