import { dbPool } from '../core/database';
import { redactPII } from '../utils/redact';

export type AuditParams = {
  userId?: number | string | null;
  actorEmail?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | number | null;
  ip?: string | null;
  meta?: any;
};

export async function writeAudit(params: AuditParams): Promise<void> {
  const {
    userId,
    actorEmail,
    action,
    resource,
    resourceId,
    ip,
    meta,
  } = params;
  const redacted = meta != null ? JSON.stringify(redactPII(meta)) : null;
  const sql = `INSERT INTO Audit_Events (user_id, actor_email, action, resource, resource_id, ip, meta)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  try {
    await dbPool.execute(sql, [
      userId ?? null,
      actorEmail ?? null,
      action,
      resource ?? null,
      resourceId != null ? String(resourceId) : null,
      ip ?? null,
      redacted,
    ]);
  } catch (err) {
    // Auditing must not break primary flows
    // eslint-disable-next-line no-console
    console.warn('[audit] write failed', err);
  }
}

