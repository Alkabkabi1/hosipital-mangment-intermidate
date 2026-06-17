import type { RequestHandler } from 'express';
import { dbPool } from '../../core/database';
import { redactPII } from '../../utils/redact';

export const listAuditEventsController: RequestHandler = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(String(req.query.pageSize || '50'), 10) || 50));
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: any[] = [];

    if (req.query.from) { where.push('ts >= ?'); params.push(String(req.query.from)); }
    if (req.query.to) { where.push('ts <= ?'); params.push(String(req.query.to)); }
    if (req.query.userId) { where.push('user_id = ?'); params.push(String(req.query.userId)); }
    if (req.query.action) { where.push('action = ?'); params.push(String(req.query.action)); }
    if (req.query.resource) { where.push('resource = ?'); params.push(String(req.query.resource)); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]]: any = await dbPool.query(`SELECT COUNT(*) AS total FROM Audit_Events ${whereSql}`, params);
    const [rows]: any = await dbPool.query(
      `SELECT id, ts, user_id, actor_email, action, resource, resource_id, ip, meta, immutable
       FROM Audit_Events ${whereSql}
       ORDER BY ts DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const data = (rows || []).map((r: any) => ({
      id: r.id,
      ts: r.ts,
      user_id: r.user_id,
      actor_email: r.actor_email,
      action: r.action,
      resource: r.resource,
      resource_id: r.resource_id,
      ip: r.ip,
      meta: r.meta ? redactPII(typeof r.meta === 'string' ? JSON.parse(r.meta) : r.meta) : null,
      immutable: r.immutable,
    }));

    res.json({ data, page, pageSize, total });
  } catch (err) {
    next(err);
  }
};

