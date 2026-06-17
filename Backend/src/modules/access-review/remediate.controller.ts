import type { RequestHandler } from 'express';
import { dbPool } from '../../core/database';
import { writeAudit } from '../../audit';

function asArray(x: any): string[] {
  if (!x) return [];
  if (Array.isArray(x)) return x.map(String);
  return [String(x)];
}

export const postRemediateRolesController: RequestHandler = async (req, res, next) => {
  const body = req.body || {};
  const userId = Number(body.userId);
  const removeRoles = asArray(body.removeRoles).map((s) => s.toUpperCase());
  const ensureRoles = asArray(body.ensureRoles).map((s) => s.toUpperCase());
  if (!userId || (!removeRoles.length && !ensureRoles.length)) {
    return res.status(400).json({ error: 'INVALID_BODY' });
  }
  const auth = (req as any).auth || {};
  const actorEmail = auth.email || null;
  try {
    const conn = await dbPool.getConnection();
    try {
      // Read before
      const [beforeRows]: any = await conn.query(
        `SELECT r.role_name FROM user_roles ur INNER JOIN roles r ON r.role_id=ur.role_id AND r.is_active=TRUE WHERE ur.user_id=? AND ur.is_active=TRUE`,
        [userId]
      );
      const before = beforeRows.map((r: any) => r.role_name);

      // Map role names to ids
      const names = Array.from(new Set([...removeRoles, ...ensureRoles]));
      let roleMap: Record<string, number> = {};
      if (names.length) {
        const [roleRows]: any = await conn.query(
          `SELECT role_id, UPPER(role_name) AS name FROM roles WHERE UPPER(role_name) IN (${names.map(()=>'?').join(',')})`,
          names
        );
        for (const r of roleRows) roleMap[r.name] = r.role_id;
      }

      await conn.beginTransaction();
      // Remove roles -> set inactive
      for (const n of removeRoles) {
        const id = roleMap[n];
        if (!id) continue;
        await conn.execute(`UPDATE user_roles SET is_active=FALSE WHERE user_id=? AND role_id=? AND is_active=TRUE`, [userId, id]);
      }
      // Ensure roles -> insert if missing
      for (const n of ensureRoles) {
        const id = roleMap[n];
        if (!id) continue;
        await conn.execute(
          `INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
           SELECT ?, ?, ?, 1 FROM DUAL WHERE NOT EXISTS (
             SELECT 1 FROM user_roles WHERE user_id=? AND role_id=? AND is_active=TRUE
           )`,
          [userId, id, actorEmail || 'system', userId, id]
        );
      }
      await conn.commit();

      const [afterRows]: any = await conn.query(
        `SELECT r.role_name FROM user_roles ur INNER JOIN roles r ON r.role_id=ur.role_id AND r.is_active=TRUE WHERE ur.user_id=? AND ur.is_active=TRUE`,
        [userId]
      );
      const after = afterRows.map((r: any) => r.role_name);

      await writeAudit({
        userId,
        actorEmail,
        action: 'rbac_remediate',
        resource: 'roles',
        resourceId: userId,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip,
        meta: { before, after, removeRoles, ensureRoles },
      });

      res.json({ success: true, before, after });
    } catch (e) {
      try { await conn.rollback(); } catch {}
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
};

