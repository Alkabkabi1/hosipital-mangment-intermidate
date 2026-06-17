import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { writeAudit } from './audit.service';
import { redactRequestSnapshot } from '../utils/redact';

type ResourceParam = string | ((req: Request) => string | undefined);

export function auditAccess(opts: { action: string; resource: ResourceParam }): RequestHandler {
  const { action, resource } = opts;
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      try {
        if (res.statusCode >= 500) return; // do not record failing server errors for access
        const auth = (req as any).auth || {};
        const userId = auth.sub || auth.userId || null;
        const actorEmail = auth.email || null;
        const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
        const resName = typeof resource === 'function' ? resource(req) : resource;
        const resourceId = req.params?.id || req.params?.requestId || null;
        const meta = { req: redactRequestSnapshot(req) };
        void writeAudit({
          userId: userId != null ? Number(userId) || userId : null,
          actorEmail,
          action,
          resource: resName || null,
          resourceId,
          ip,
          meta,
        });
      } catch {}
    });
    next();
  };
}

